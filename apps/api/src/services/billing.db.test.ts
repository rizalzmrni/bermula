import { PLAN, toStripeLookupKey } from "@bermula/core/plans";
import {
  customers,
  subscriptions,
  webhookEvents,
} from "@bermula/db/schema/billing";
import { createTestDb } from "@bermula/db/testing";
import { createLogger } from "@bermula/observability/logger";
import type { PaymentGateway } from "@bermula/payments/gateway";
import { ORGANIZATION_METADATA_KEY } from "@bermula/payments/subscription";
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
const PRO_PRICE_ID = "price_pro";
// 2026-11-25T00:00:00Z dalam detik Unix.
const PERIOD_END = 1_795_564_800;

/** Gateway palsu: mencatat panggilan dan mengembalikan data contoh. */
const createFakeGateway = (stripeSubscriptions: SubscriptionSource[] = []) => {
  const calls = { checkout: 0, customers: 0 };
  const gateway: PaymentGateway = {
    createCheckoutSession: (input) => {
      calls.checkout += 1;
      return Promise.resolve({
        url: `https://checkout.stripe.test/${input.customerId}`,
      });
    },
    createCustomer: () => {
      calls.customers += 1;
      return Promise.resolve({ id: `cus_${calls.customers}` });
    },
    createPortalSession: (input) =>
      Promise.resolve({
        url: `https://portal.stripe.test/${input.customerId}`,
      }),
    findPriceId: (lookupKey) =>
      Promise.resolve(
        lookupKey === toStripeLookupKey(PLAN.pro) ? PRO_PRICE_ID : null
      ),
    retrieveSubscription: (id) => {
      const found = stripeSubscriptions.find((item) => item.id === id);
      return found
        ? Promise.resolve(found)
        : Promise.reject(new Error(`No such subscription: ${id}`));
    },
  };
  return { calls, gateway };
};

const stripeSubscription = (
  overrides: Partial<SubscriptionSource> = {}
): SubscriptionSource => ({
  cancel_at: null,
  cancel_at_period_end: false,
  customer: "cus_1",
  id: "sub_1",
  items: {
    data: [
      {
        current_period_end: PERIOD_END,
        price: { lookup_key: toStripeLookupKey(PLAN.pro) },
      },
    ],
  },
  metadata: {},
  status: "active",
  ...overrides,
});

const subscriptionEvent = (id: string, subscriptionId = "sub_1") =>
  createTestEvent({
    data: { object: { id: subscriptionId, object: "subscription" } },
    id,
    type: "customer.subscription.updated",
  });

describe("billing service (PGlite)", () => {
  let organizationId = "";

  beforeEach(async () => {
    await db.delete(webhookEvents);
    await db.delete(subscriptions);
    await db.delete(customers);
    const organization = await insertOrganization(db, "Tim tagihan");
    organizationId = organization.id;
  });

  afterAll(() => testDb.close());

  const checkout = (gateway: PaymentGateway, role = "owner") =>
    createCheckoutSession({
      appUrl: APP_URL,
      db,
      organizationId,
      payments: gateway,
      plan: PLAN.pro,
      role,
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

  it("creates one customer and reuses it for later checkouts", async () => {
    const { calls, gateway } = createFakeGateway();

    const first = await checkout(gateway);
    const second = await checkout(gateway, "member,admin");

    expect(first.url).toBe("https://checkout.stripe.test/cus_1");
    expect(second.url).toBe(first.url);
    expect(calls.customers).toBe(1);
  });

  it("only lets owners and admins start a checkout", async () => {
    const { calls, gateway } = createFakeGateway();

    await expect(checkout(gateway, "member")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(calls.customers).toBe(0);
  });

  it("reports a missing Stripe price as not configured", async () => {
    const { gateway } = createFakeGateway();

    await expect(
      createCheckoutSession({
        appUrl: APP_URL,
        db,
        organizationId,
        payments: gateway,
        plan: PLAN.business,
        role: "owner",
      })
    ).rejects.toMatchObject({ code: "PRICE_NOT_CONFIGURED", status: 503 });
  });

  it("syncs a subscription from a webhook and blocks a second checkout", async () => {
    const { gateway } = createFakeGateway([stripeSubscription()]);
    await checkout(gateway);

    const outcome = await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_sync"),
      logger,
      payments: gateway,
    });
    const overview = await getBillingOverview({
      billingEnabled: true,
      db,
      organizationId,
      role: "owner",
    });

    expect(outcome).toBe(WEBHOOK_OUTCOME.synced);
    expect(overview.plan).toBe(PLAN.pro);
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

  it("skips an event it already processed", async () => {
    const subscription = stripeSubscription();
    const { gateway } = createFakeGateway([subscription]);
    await checkout(gateway);
    const event = await subscriptionEvent("evt_repeat");

    await processWebhookEvent({ db, event, logger, payments: gateway });
    // Perubahan di Stripe setelah event pertama tidak diterapkan ulang oleh
    // pengiriman ulang event yang sama.
    subscription.status = "canceled";
    const outcome = await processWebhookEvent({
      db,
      event,
      logger,
      payments: gateway,
    });
    const [row] = await db.select().from(subscriptions);

    expect(outcome).toBe(WEBHOOK_OUTCOME.duplicate);
    expect(row?.status).toBe("active");
  });

  it("applies the latest Stripe state on a newer event", async () => {
    const subscription = stripeSubscription();
    const { gateway } = createFakeGateway([subscription]);
    await checkout(gateway);
    await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_a"),
      logger,
      payments: gateway,
    });

    subscription.status = "canceled";
    await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_b"),
      logger,
      payments: gateway,
    });
    const rows = await db.select().from(subscriptions);
    const overview = await getBillingOverview({
      billingEnabled: true,
      db,
      organizationId,
      role: "owner",
    });

    expect(rows).toHaveLength(1);
    expect(overview.plan).toBe(PLAN.free);
    expect(overview.subscription?.status).toBe("canceled");
  });

  it("falls back to verified metadata when the customer is unknown", async () => {
    const { gateway } = createFakeGateway([
      stripeSubscription({
        customer: "cus_dashboard",
        metadata: { [ORGANIZATION_METADATA_KEY]: organizationId },
      }),
    ]);

    const outcome = await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_meta"),
      logger,
      payments: gateway,
    });

    expect(outcome).toBe(WEBHOOK_OUTCOME.synced);
  });

  it("skips subscriptions without an owner or a known plan", async () => {
    const { gateway } = createFakeGateway([
      stripeSubscription({
        customer: "cus_unknown",
        id: "sub_orphan",
        metadata: { [ORGANIZATION_METADATA_KEY]: "not-a-uuid" },
      }),
      stripeSubscription({
        id: "sub_legacy",
        items: {
          data: [
            {
              current_period_end: PERIOD_END,
              price: { lookup_key: "legacy" },
            },
          ],
        },
      }),
    ]);

    const orphan = await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_orphan", "sub_orphan"),
      logger,
      payments: gateway,
    });
    const legacy = await processWebhookEvent({
      db,
      event: await subscriptionEvent("evt_legacy", "sub_legacy"),
      logger,
      payments: gateway,
    });
    const recorded = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, "evt_orphan"));

    expect([orphan, legacy]).toStrictEqual([
      WEBHOOK_OUTCOME.skipped,
      WEBHOOK_OUTCOME.skipped,
    ]);
    // Dicatat agar Stripe tidak terus mengirim ulang event yang tak bisa dipakai.
    expect(recorded).toHaveLength(1);
  });

  it("records unrelated events without calling Stripe", async () => {
    const { gateway } = createFakeGateway();

    const outcome = await processWebhookEvent({
      db,
      event: await createTestEvent({
        data: { object: { id: "in_1", object: "invoice" } },
        id: "evt_invoice",
        type: "invoice.paid",
      }),
      logger,
      payments: gateway,
    });

    expect(outcome).toBe(WEBHOOK_OUTCOME.ignored);
  });

  it("does not record an event whose sync failed, so Stripe retries it", async () => {
    const { gateway } = createFakeGateway();

    await expect(
      processWebhookEvent({
        db,
        event: await subscriptionEvent("evt_fail", "sub_missing"),
        logger,
        payments: gateway,
      })
    ).rejects.toThrow("sub_missing");
    await expect(db.select().from(webhookEvents)).resolves.toHaveLength(0);
  });

  it("opens the portal only for an organization with a customer", async () => {
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
    await checkout(gateway);
    await expect(portal()).resolves.toStrictEqual({
      url: "https://portal.stripe.test/cus_1",
    });
  });
});
