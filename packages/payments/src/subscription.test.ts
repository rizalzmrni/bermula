import { PLAN, toStripeLookupKey } from "@bermula/core/plans";
import { describe, expect, it } from "vitest";

import {
  ORGANIZATION_METADATA_KEY,
  getSubscriptionIdFromEvent,
  toSubscriptionSnapshot,
} from "./subscription";
import type { SubscriptionSource } from "./subscription";
import { createTestEvent } from "./testing";

const ORGANIZATION_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
// 2026-11-25T00:00:00Z dalam detik Unix (format waktu Stripe).
const PERIOD_END = 1_795_564_800;

const subscription = (
  overrides: Partial<SubscriptionSource> = {}
): SubscriptionSource => ({
  cancel_at: null,
  cancel_at_period_end: false,
  customer: "cus_123",
  id: "sub_123",
  items: {
    data: [
      {
        current_period_end: PERIOD_END,
        price: { lookup_key: toStripeLookupKey(PLAN.pro) },
      },
    ],
  },
  metadata: { [ORGANIZATION_METADATA_KEY]: ORGANIZATION_ID },
  status: "active",
  ...overrides,
});

describe(toSubscriptionSnapshot, () => {
  it("maps a subscription to the stored shape", () => {
    expect(toSubscriptionSnapshot(subscription())).toStrictEqual({
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date("2026-11-25T00:00:00Z"),
      organizationId: ORGANIZATION_ID,
      plan: PLAN.pro,
      status: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
    });
  });

  it("accepts an expanded customer object", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({ customer: { id: "cus_expanded" } })
    );

    expect(snapshot.stripeCustomerId).toBe("cus_expanded");
  });

  it("treats a scheduled cancel date as ending", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({ cancel_at: PERIOD_END })
    );

    expect(snapshot.cancelAtPeriodEnd).toBeTruthy();
  });

  it("leaves unknown prices and missing metadata as null", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({
        items: {
          data: [
            {
              current_period_end: PERIOD_END,
              price: { lookup_key: "legacy_price" },
            },
          ],
        },
        metadata: {},
      })
    );

    expect(snapshot.plan).toBeNull();
    expect(snapshot.organizationId).toBeNull();
  });
});

describe(getSubscriptionIdFromEvent, () => {
  it("reads the subscription from a completed subscription checkout", async () => {
    const event = await createTestEvent({
      data: {
        object: {
          id: "cs_1",
          mode: "subscription",
          object: "checkout.session",
          subscription: "sub_abc",
        },
      },
      id: "evt_1",
      type: "checkout.session.completed",
    });

    expect(getSubscriptionIdFromEvent(event)).toBe("sub_abc");
  });

  it("ignores one-off payment checkouts", async () => {
    const event = await createTestEvent({
      data: {
        object: {
          id: "cs_2",
          mode: "payment",
          object: "checkout.session",
          subscription: null,
        },
      },
      id: "evt_1",
      type: "checkout.session.completed",
    });

    expect(getSubscriptionIdFromEvent(event)).toBeNull();
  });

  it("reads the id of subscription lifecycle events", async () => {
    const event = await createTestEvent({
      data: { object: { id: "sub_xyz", object: "subscription" } },
      id: "evt_1",
      type: "customer.subscription.deleted",
    });

    expect(getSubscriptionIdFromEvent(event)).toBe("sub_xyz");
  });

  it("ignores unrelated events", async () => {
    const event = await createTestEvent({
      data: { object: { id: "in_1", object: "invoice" } },
      id: "evt_1",
      type: "invoice.paid",
    });

    expect(getSubscriptionIdFromEvent(event)).toBeNull();
  });
});
