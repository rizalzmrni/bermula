import { PLAN } from "@bermula/core/plans";
import { subscriptions, webhookEvents } from "@bermula/db/schema/billing";
import { createTestDb } from "@bermula/db/testing";
import { createLogger } from "@bermula/observability/logger";
import type { PaymentGateway } from "@bermula/payments/gateway";
import { PLAN_METADATA_KEY } from "@bermula/payments/subscription";
import type { SubscriptionSource } from "@bermula/payments/subscription";
import { createTestEvent } from "@bermula/payments/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { insertOrganization } from "../testing/db-fixtures";
import {
  WEBHOOK_OUTCOME,
  createCheckoutSession,
  createPortalSession,
  getBillingOverview,
  processWebhookEvent,
} from "./billing";

const testDb = await createTestDb();
const { db } = testDb;
const logger = createLogger({ minLevel: "error", service: "test" });

const APP_URL = "http://localhost:5173";
const PRO_PRODUCT_ID = "prod_pro";
const CUSTOMER_IP = "203.0.113.7";

/** Gateway palsu: mencatat input Checkout dan mengembalikan URL contoh. */
const createFakeGateway = () => {
  const checkouts: Parameters<PaymentGateway["createCheckout"]>[0][] = [];
  const gateway: PaymentGateway = {
    createCheckout: (input) => {
      checkouts.push(input);
      return Promise.resolve({
        url: `https://checkout.polar.test/${input.productId}`,
      });
    },
    createPortalSession: (input) =>
      Promise.resolve({
        url: `https://portal.polar.test/${input.organizationId}`,
      }),
    findProductId: (plan) =>
      Promise.resolve(plan === PLAN.pro ? PRO_PRODUCT_ID : null),
  };
  return { checkouts, gateway };
};

const polarSubscription = (
  overrides: Partial<SubscriptionSource> = {}
): SubscriptionSource => ({
  cancel_at_period_end: false,
  created_at: "2026-10-25T00:00:00Z",
  current_period_end: "2026-11-25T00:00:00Z",
  customer: { external_id: null, id: "cus_1" },
  ends_at: null,
  id: "sub_1",
  modified_at: "2026-10-25T00:00:00Z",
  product: { metadata: { [PLAN_METADATA_KEY]: PLAN.pro } },
  status: "active",
  ...overrides,
});

/** Satu pengiriman webhook bertanda tangan berisi subscription. */
const deliver = async (
  webhookId: string,
  data: SubscriptionSource,
  type = "subscription.updated"
) =>
  processWebhookEvent({
    db,
    event: await createTestEvent({ data, type }),
    logger,
    webhookId,
  });

describe("billing service (PGlite)", () => {
  let organizationId = "";

  beforeEach(async () => {
    await db.delete(webhookEvents);
    await db.delete(subscriptions);
    const organization = await insertOrganization(db, "Tim tagihan");
    organizationId = organization.id;
  });

  afterAll(() => testDb.close());

  const checkout = (gateway: PaymentGateway, role = "owner") =>
    createCheckoutSession({
      appUrl: APP_URL,
      customerIpAddress: CUSTOMER_IP,
      db,
      organizationId,
      payments: gateway,
      plan: PLAN.pro,
      role,
    });

  /** Subscription milik organisasi test; `external_id` diisi seperti saat Checkout. */
  const ownedSubscription = (overrides: Partial<SubscriptionSource> = {}) =>
    polarSubscription({
      customer: { external_id: organizationId, id: "cus_1" },
      ...overrides,
    });

  it("reports the free plan before any subscription", async () => {
    const overview = await getBillingOverview({
      billingEnabled: true,
      db,
      organizationId,
      role: "member",
    });

    expect(overview).toStrictEqual({
      billingEnabled: true,
      canManage: false,
      hasBillingAccount: false,
      plan: PLAN.free,
      subscription: null,
    });
  });

  it("links the checkout to the organization and forwards the user's IP", async () => {
    const { checkouts, gateway } = createFakeGateway();

    const session = await checkout(gateway, "member,admin");

    expect(session.url).toBe(`https://checkout.polar.test/${PRO_PRODUCT_ID}`);
    expect(checkouts).toStrictEqual([
      {
        customerIpAddress: CUSTOMER_IP,
        organizationId,
        productId: PRO_PRODUCT_ID,
        returnUrl: `${APP_URL}/settings/billing?checkout=cancel`,
        successUrl: `${APP_URL}/settings/billing?checkout=success`,
      },
    ]);
  });

  it("only lets owners and admins start a checkout", async () => {
    const { checkouts, gateway } = createFakeGateway();

    await expect(checkout(gateway, "member")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(checkouts).toHaveLength(0);
  });

  it("reports a missing Polar product as not configured", async () => {
    const { gateway } = createFakeGateway();

    await expect(
      createCheckoutSession({
        appUrl: APP_URL,
        customerIpAddress: undefined,
        db,
        organizationId,
        payments: gateway,
        plan: PLAN.business,
        role: "owner",
      })
    ).rejects.toMatchObject({ code: "PRICE_NOT_CONFIGURED", status: 503 });
  });

  it("syncs a subscription from a webhook and blocks a second checkout", async () => {
    const { gateway } = createFakeGateway();

    const outcome = await deliver("msg_sync", ownedSubscription());
    const overview = await getBillingOverview({
      billingEnabled: true,
      db,
      organizationId,
      role: "owner",
    });

    expect(outcome).toBe(WEBHOOK_OUTCOME.synced);
    expect(overview.plan).toBe(PLAN.pro);
    expect(overview.hasBillingAccount).toBeTruthy();
    expect(overview.subscription).toStrictEqual({
      cancelAtPeriodEnd: false,
      currentPeriodEnd: "2026-11-25T00:00:00.000Z",
      plan: PLAN.pro,
      status: "active",
    });
    await expect(checkout(gateway)).rejects.toMatchObject({
      code: "ALREADY_SUBSCRIBED",
      status: 409,
    });
  });

  it("skips a delivery it already processed", async () => {
    await deliver("msg_repeat", ownedSubscription());

    // Pengiriman ulang dengan `webhook-id` yang sama tidak diterapkan lagi,
    // walau isinya (secara teori) berbeda.
    const outcome = await deliver(
      "msg_repeat",
      ownedSubscription({
        modified_at: "2026-10-26T00:00:00Z",
        status: "canceled",
      })
    );
    const [row] = await db.select().from(subscriptions);

    expect(outcome).toBe(WEBHOOK_OUTCOME.duplicate);
    expect(row?.status).toBe("active");
  });

  it("applies a newer snapshot and ignores an older one that arrives late", async () => {
    await deliver(
      "msg_new",
      ownedSubscription({
        modified_at: "2026-10-26T00:00:00Z",
        status: "canceled",
      }),
      "subscription.canceled"
    );
    const late = await deliver(
      "msg_old",
      ownedSubscription({ modified_at: "2026-10-25T00:00:00Z" }),
      "subscription.active"
    );
    const rows = await db.select().from(subscriptions);
    const overview = await getBillingOverview({
      billingEnabled: true,
      db,
      organizationId,
      role: "owner",
    });

    expect(late).toBe(WEBHOOK_OUTCOME.stale);
    expect(rows).toHaveLength(1);
    expect(overview.plan).toBe(PLAN.free);
    expect(overview.subscription?.status).toBe("canceled");
  });

  it("skips subscriptions without an owner or a known plan", async () => {
    const orphan = await deliver(
      "msg_orphan",
      polarSubscription({
        customer: { external_id: "not-a-uuid", id: "cus_dashboard" },
        id: "sub_orphan",
      })
    );
    const deletedOrganization = await deliver(
      "msg_deleted",
      polarSubscription({
        customer: {
          external_id: "0f8fad5b-d9cb-469f-a165-70867728950e",
          id: "cus_gone",
        },
        id: "sub_gone",
      })
    );
    const legacy = await deliver(
      "msg_legacy",
      ownedSubscription({
        id: "sub_legacy",
        product: { metadata: { [PLAN_METADATA_KEY]: "legacy" } },
      })
    );
    const recorded = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, "msg_orphan"));

    expect([orphan, deletedOrganization, legacy]).toStrictEqual([
      WEBHOOK_OUTCOME.skipped,
      WEBHOOK_OUTCOME.skipped,
      WEBHOOK_OUTCOME.skipped,
    ]);
    // Dicatat agar Polar tidak terus mengirim ulang event yang tak bisa dipakai.
    expect(recorded).toHaveLength(1);
    await expect(db.select().from(subscriptions)).resolves.toHaveLength(0);
  });

  it("records unrelated events as ignored", async () => {
    const outcome = await processWebhookEvent({
      db,
      event: await createTestEvent({
        data: { id: "ord_1" },
        type: "order.paid",
      }),
      logger,
      webhookId: "msg_order",
    });

    expect(outcome).toBe(WEBHOOK_OUTCOME.ignored);
    await expect(db.select().from(webhookEvents)).resolves.toHaveLength(1);
  });

  it("does not record a delivery whose sync failed, so Polar retries it", async () => {
    await expect(
      deliver(
        "msg_fail",
        // Tanggal yang tidak bisa diserialisasi membuat upsert gagal.
        ownedSubscription({ current_period_end: "not-a-date" })
      )
    ).rejects.toThrow("Invalid time value");
    await expect(db.select().from(webhookEvents)).resolves.toHaveLength(0);
  });

  it("opens the portal only for an organization with a subscription", async () => {
    const { gateway } = createFakeGateway();
    const portal = () =>
      createPortalSession({
        appUrl: APP_URL,
        db,
        organizationId,
        payments: gateway,
        role: "admin",
      });

    await expect(portal()).rejects.toMatchObject({
      code: "NO_BILLING_ACCOUNT",
      status: 409,
    });
    await deliver("msg_portal", ownedSubscription());
    await expect(portal()).resolves.toStrictEqual({
      url: `https://portal.polar.test/${organizationId}`,
    });
  });
});
