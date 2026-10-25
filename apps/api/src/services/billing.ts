import {
  isEntitledStatus,
  resolveEffectivePlan,
  toStripeLookupKey,
} from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import type { QueryDb } from "@bermula/db/client";
import { organizations } from "@bermula/db/schema/auth";
import {
  customers,
  subscriptions,
  webhookEvents,
} from "@bermula/db/schema/billing";
import type { Subscription } from "@bermula/db/schema/billing";
import type { Logger } from "@bermula/observability/logger";
import type { PaymentGateway } from "@bermula/payments/gateway";
import {
  getSubscriptionIdFromEvent,
  toSubscriptionSnapshot,
} from "@bermula/payments/subscription";
import type { SubscriptionSnapshot } from "@bermula/payments/subscription";
import type { StripeEvent } from "@bermula/payments/webhook";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { ApiError } from "../lib/errors";
import { ORGANIZATION_MANAGER_ROLES, hasOrganizationRole } from "../lib/roles";

/** Halaman tagihan di apps/app; tujuan kembali dari Checkout & Portal. */
const BILLING_PAGE_PATH = "/settings/billing";

const notConfigured = () =>
  new ApiError({
    code: "BILLING_NOT_CONFIGURED",
    message: "Fitur tagihan belum dikonfigurasi.",
    status: 503,
  });

/** Stripe opsional (pasangan env); tanpa konfigurasi, fitur tagihan membalas 503. */
export const requirePayments = (payments: PaymentGateway | undefined) => {
  if (!payments) {
    throw notConfigured();
  }
  return payments;
};

/** Webhook butuh gateway (mengambil subscription) dan secret signature. */
export const requireWebhookConfig = ({
  payments,
  secret,
}: {
  payments: PaymentGateway | undefined;
  secret: string | undefined;
}) => {
  if (!(payments && secret)) {
    throw notConfigured();
  }
  return { payments, secret };
};

const assertBillingManager = (role: string) => {
  if (!hasOrganizationRole(role, ORGANIZATION_MANAGER_ROLES)) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Hanya owner atau admin yang dapat mengelola tagihan.",
      status: 403,
    });
  }
};

/**
 * Satu organisasi bisa punya beberapa baris (riwayat). Yang masih berhak dipilih
 * lebih dulu; selain itu yang terbaru, agar status `canceled` tetap terlihat.
 */
const findCurrentSubscription = async (
  db: QueryDb,
  organizationId: string
): Promise<Subscription | null> => {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .orderBy(desc(subscriptions.createdAt));
  return rows.find((row) => isEntitledStatus(row.status)) ?? rows[0] ?? null;
};

const findCustomer = async (db: QueryDb, organizationId: string) => {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .limit(1);
  return customer ?? null;
};

/** Bentuk respons API: tanggal sebagai ISO string, tanpa ID internal Stripe. */
const toSubscriptionResponse = (subscription: Subscription) => ({
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  plan: subscription.plan,
  status: subscription.status,
});

export const getBillingOverview = async ({
  db,
  organizationId,
  role,
  billingEnabled,
}: {
  db: QueryDb;
  organizationId: string;
  role: string;
  billingEnabled: boolean;
}) => {
  const [subscription, customer] = await Promise.all([
    findCurrentSubscription(db, organizationId),
    findCustomer(db, organizationId),
  ]);

  return {
    billingEnabled,
    canManage: hasOrganizationRole(role, ORGANIZATION_MANAGER_ROLES),
    hasBillingAccount: customer !== null,
    plan: resolveEffectivePlan(subscription),
    subscription: subscription ? toSubscriptionResponse(subscription) : null,
  };
};

/**
 * Customer Stripe organisasi, dibuat saat Checkout pertama. Idempotency key
 * membuat request ganda mendapat customer yang sama; `onConflictDoNothing`
 * menangani dua request yang menyimpan bersamaan.
 */
const getOrCreateCustomerId = async ({
  db,
  organizationId,
  payments,
}: {
  db: QueryDb;
  organizationId: string;
  payments: PaymentGateway;
}) => {
  const existing = await findCustomer(db, organizationId);
  if (existing) {
    return existing.stripeCustomerId;
  }

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  const created = await payments.createCustomer({
    idempotencyKey: `customer-${organizationId}`,
    name: organization?.name ?? organizationId,
    organizationId,
  });

  await db
    .insert(customers)
    .values({ organizationId, stripeCustomerId: created.id })
    .onConflictDoNothing();
  const stored = await findCustomer(db, organizationId);
  return stored?.stripeCustomerId ?? created.id;
};

export const createCheckoutSession = async ({
  appUrl,
  db,
  organizationId,
  payments,
  plan,
  role,
}: {
  appUrl: string;
  db: QueryDb;
  organizationId: string;
  payments: PaymentGateway;
  plan: PaidPlanId;
  role: string;
}) => {
  assertBillingManager(role);

  // Ganti paket atau batal lewat Portal; Checkout kedua = dua tagihan aktif.
  const current = await findCurrentSubscription(db, organizationId);
  if (current && isEntitledStatus(current.status)) {
    throw new ApiError({
      code: "ALREADY_SUBSCRIBED",
      message:
        "Organisasi sudah berlangganan. Ubah paket lewat portal tagihan.",
      status: 409,
    });
  }

  const priceId = await payments.findPriceId(toStripeLookupKey(plan));
  if (!priceId) {
    throw new ApiError({
      code: "PRICE_NOT_CONFIGURED",
      message: "Harga paket ini belum tersedia.",
      status: 503,
    });
  }

  const customerId = await getOrCreateCustomerId({
    db,
    organizationId,
    payments,
  });
  const session = await payments.createCheckoutSession({
    cancelUrl: `${appUrl}${BILLING_PAGE_PATH}?checkout=cancel`,
    customerId,
    organizationId,
    priceId,
    successUrl: `${appUrl}${BILLING_PAGE_PATH}?checkout=success`,
  });
  if (!session.url) {
    throw new Error("Stripe Checkout session has no URL");
  }
  return { url: session.url };
};

export const createPortalSession = async ({
  appUrl,
  db,
  organizationId,
  payments,
  role,
}: {
  appUrl: string;
  db: QueryDb;
  organizationId: string;
  payments: PaymentGateway;
  role: string;
}) => {
  assertBillingManager(role);

  const customer = await findCustomer(db, organizationId);
  if (!customer) {
    throw new ApiError({
      code: "NO_BILLING_ACCOUNT",
      message:
        "Organisasi belum punya akun tagihan. Pilih paket terlebih dulu.",
      status: 409,
    });
  }

  return payments.createPortalSession({
    customerId: customer.stripeCustomerId,
    returnUrl: `${appUrl}${BILLING_PAGE_PATH}`,
  });
};

const organizationIdSchema = z.uuid();

/**
 * Pemilik subscription: dari tabel customer (dibuat api sendiri), lalu dari
 * metadata. Metadata bisa diisi manual di dashboard Stripe, jadi dicek ke DB.
 */
const resolveOrganizationId = async (
  db: QueryDb,
  snapshot: SubscriptionSnapshot
) => {
  const [customer] = await db
    .select({ organizationId: customers.organizationId })
    .from(customers)
    .where(eq(customers.stripeCustomerId, snapshot.stripeCustomerId))
    .limit(1);
  if (customer) {
    return customer.organizationId;
  }

  const parsed = organizationIdSchema.safeParse(snapshot.organizationId);
  if (!parsed.success) {
    return null;
  }
  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, parsed.data))
    .limit(1);
  return organization?.id ?? null;
};

export const WEBHOOK_OUTCOME = {
  duplicate: "duplicate",
  ignored: "ignored",
  skipped: "skipped",
  synced: "synced",
} as const;

export type WebhookOutcome =
  (typeof WEBHOOK_OUTCOME)[keyof typeof WEBHOOK_OUTCOME];

const syncSubscription = async ({
  db,
  logger,
  snapshot,
}: {
  db: QueryDb;
  logger: Logger;
  snapshot: SubscriptionSnapshot;
}): Promise<WebhookOutcome> => {
  const fields = { stripeSubscriptionId: snapshot.stripeSubscriptionId };
  const { plan } = snapshot;
  if (!plan) {
    logger.warn("Subscription price has no known lookup key", fields);
    return WEBHOOK_OUTCOME.skipped;
  }
  const organizationId = await resolveOrganizationId(db, snapshot);
  if (!organizationId) {
    logger.warn("Subscription has no known organization", fields);
    return WEBHOOK_OUTCOME.skipped;
  }

  const values = {
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    organizationId,
    plan,
    status: snapshot.status,
    stripeCustomerId: snapshot.stripeCustomerId,
  };
  await db
    .insert(subscriptions)
    .values({ ...values, stripeSubscriptionId: snapshot.stripeSubscriptionId })
    .onConflictDoUpdate({
      set: values,
      target: subscriptions.stripeSubscriptionId,
    });
  return WEBHOOK_OUTCOME.synced;
};

/**
 * Event yang sudah tercatat dilewati. Selain itu subscription diambil ulang dari
 * Stripe (bukan dari payload event) lalu di-upsert, jadi urutan event yang tiba
 * tidak berpengaruh dan pemrosesan ulang aman. Event baru dicatat setelah sync
 * berhasil: bila sync gagal, Stripe mengirim ulang dan sync dicoba lagi.
 */
export const processWebhookEvent = async ({
  db,
  event,
  logger,
  payments,
}: {
  db: QueryDb;
  event: StripeEvent;
  logger: Logger;
  payments: PaymentGateway;
}): Promise<WebhookOutcome> => {
  const [processed] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id))
    .limit(1);
  if (processed) {
    return WEBHOOK_OUTCOME.duplicate;
  }

  const subscriptionId = getSubscriptionIdFromEvent(event);
  const outcome = subscriptionId
    ? await syncSubscription({
        db,
        logger,
        snapshot: toSubscriptionSnapshot(
          await payments.retrieveSubscription(subscriptionId)
        ),
      })
    : WEBHOOK_OUTCOME.ignored;

  await db
    .insert(webhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing();
  return outcome;
};
