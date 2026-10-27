import { isEntitledStatus, resolveEffectivePlan } from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import type { QueryDb } from "@bermula/db/client";
import { organizations } from "@bermula/db/schema/auth";
import { subscriptions, webhookEvents } from "@bermula/db/schema/billing";
import type { Subscription } from "@bermula/db/schema/billing";
import type { Logger } from "@bermula/observability/logger";
import type { PaymentGateway } from "@bermula/payments/gateway";
import {
  getSubscriptionFromEvent,
  toSubscriptionSnapshot,
} from "@bermula/payments/subscription";
import type { SubscriptionSnapshot } from "@bermula/payments/subscription";
import type { PolarWebhookEvent } from "@bermula/payments/webhook";
import { desc, eq, lt } from "drizzle-orm";
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

/** Polar opsional (pasangan env); tanpa konfigurasi, fitur tagihan membalas 503. */
export const requirePayments = (payments: PaymentGateway | undefined) => {
  if (!payments) {
    throw notConfigured();
  }
  return payments;
};

/** Webhook hanya butuh secret signature; datanya diambil dari payload. */
export const requireWebhookSecret = (secret: string | undefined) => {
  if (!secret) {
    throw notConfigured();
  }
  return secret;
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

/** Bentuk respons API: tanggal sebagai ISO string, tanpa ID internal Polar. */
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
  const subscription = await findCurrentSubscription(db, organizationId);

  return {
    billingEnabled,
    canManage: hasOrganizationRole(role, ORGANIZATION_MANAGER_ROLES),
    // Customer Polar baru ada setelah Checkout pertama selesai; saat itu
    // webhook sudah menyimpan langganannya.
    hasBillingAccount: subscription !== null,
    plan: resolveEffectivePlan(subscription),
    subscription: subscription ? toSubscriptionResponse(subscription) : null,
  };
};

export const createCheckoutSession = async ({
  appUrl,
  customerIpAddress,
  db,
  organizationId,
  payments,
  plan,
  role,
}: {
  appUrl: string;
  /** IP browser pengguna (bukan IP Worker app) untuk mata uang & pajak. */
  customerIpAddress: string | undefined;
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

  const productId = await payments.findProductId(plan);
  if (!productId) {
    throw new ApiError({
      code: "PRICE_NOT_CONFIGURED",
      message: "Harga paket ini belum tersedia.",
      status: 503,
    });
  }

  return payments.createCheckout({
    customerIpAddress,
    organizationId,
    productId,
    returnUrl: `${appUrl}${BILLING_PAGE_PATH}?checkout=cancel`,
    successUrl: `${appUrl}${BILLING_PAGE_PATH}?checkout=success`,
  });
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

  // Tanpa langganan apa pun, customer Polar belum ada dan Portal akan gagal.
  const subscription = await findCurrentSubscription(db, organizationId);
  if (!subscription) {
    throw new ApiError({
      code: "NO_BILLING_ACCOUNT",
      message:
        "Organisasi belum punya akun tagihan. Pilih paket terlebih dulu.",
      status: 409,
    });
  }

  return payments.createPortalSession({
    organizationId,
    returnUrl: `${appUrl}${BILLING_PAGE_PATH}`,
  });
};

const organizationIdSchema = z.uuid();

/**
 * Pemilik subscription dari `external_id` customer. Hanya api yang mengisinya
 * (saat Checkout), tetapi tetap dicek ke DB: organisasi bisa sudah dihapus.
 */
const resolveOrganizationId = async (
  db: QueryDb,
  snapshot: SubscriptionSnapshot
) => {
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
  /** Snapshot lebih lama dari yang tersimpan (event tiba tidak berurutan). */
  stale: "stale",
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
  const fields = { polarSubscriptionId: snapshot.polarSubscriptionId };
  const { plan } = snapshot;
  if (!plan) {
    logger.warn("Subscription product has no known plan metadata", fields);
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
    polarCustomerId: snapshot.polarCustomerId,
    polarModifiedAt: snapshot.modifiedAt,
    status: snapshot.status,
  };
  // Upsert bersyarat dalam satu statement: baris hanya diganti snapshot yang
  // lebih baru, sehingga event lama yang tiba belakangan tidak menimpanya.
  const written = await db
    .insert(subscriptions)
    .values({ ...values, polarSubscriptionId: snapshot.polarSubscriptionId })
    .onConflictDoUpdate({
      set: values,
      setWhere: lt(subscriptions.polarModifiedAt, snapshot.modifiedAt),
      target: subscriptions.polarSubscriptionId,
    })
    .returning({ id: subscriptions.id });
  return written.length > 0 ? WEBHOOK_OUTCOME.synced : WEBHOOK_OUTCOME.stale;
};

/**
 * Pengiriman yang sudah tercatat (`webhook-id`) dilewati. Selain itu
 * subscription dari payload di-upsert bila lebih baru dari yang tersimpan, jadi
 * urutan event yang tiba tidak berpengaruh dan pemrosesan ulang aman, tanpa
 * memanggil API Polar (webhook harus dibalas cepat). Pengiriman baru dicatat
 * setelah sync berhasil: bila sync gagal, Polar mengirim ulang.
 */
export const processWebhookEvent = async ({
  db,
  event,
  logger,
  webhookId,
}: {
  db: QueryDb;
  event: PolarWebhookEvent;
  logger: Logger;
  /** Header `webhook-id`; sama untuk setiap pengiriman ulang event yang sama. */
  webhookId: string;
}): Promise<WebhookOutcome> => {
  const [processed] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, webhookId))
    .limit(1);
  if (processed) {
    return WEBHOOK_OUTCOME.duplicate;
  }

  const subscription = getSubscriptionFromEvent(event);
  const outcome = subscription
    ? await syncSubscription({
        db,
        logger,
        snapshot: toSubscriptionSnapshot(subscription),
      })
    : WEBHOOK_OUTCOME.ignored;

  await db
    .insert(webhookEvents)
    .values({ id: webhookId, type: event.type })
    .onConflictDoNothing();
  return outcome;
};
