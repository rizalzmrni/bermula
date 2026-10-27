import { PLAN } from "@bermula/core/plans";
import { describe, expect, it } from "vitest";

import {
  PLAN_METADATA_KEY,
  getSubscriptionFromEvent,
  toSubscriptionSnapshot,
} from "./subscription";
import type { SubscriptionSource } from "./subscription";
import { createTestEvent } from "./testing";

const ORGANIZATION_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

const subscription = (
  overrides: Partial<SubscriptionSource> = {}
): SubscriptionSource => ({
  cancel_at_period_end: false,
  created_at: "2026-10-25T00:00:00Z",
  current_period_end: "2026-11-25T00:00:00Z",
  customer: { external_id: ORGANIZATION_ID, id: "cus_123" },
  ends_at: null,
  id: "sub_123",
  modified_at: "2026-10-26T00:00:00Z",
  product: { metadata: { [PLAN_METADATA_KEY]: PLAN.pro } },
  status: "active",
  ...overrides,
});

describe(toSubscriptionSnapshot, () => {
  it("maps a subscription to the stored shape", () => {
    expect(toSubscriptionSnapshot(subscription())).toStrictEqual({
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date("2026-11-25T00:00:00Z"),
      modifiedAt: new Date("2026-10-26T00:00:00Z"),
      organizationId: ORGANIZATION_ID,
      plan: PLAN.pro,
      polarCustomerId: "cus_123",
      polarSubscriptionId: "sub_123",
      status: "active",
    });
  });

  it("falls back to the creation time for a never-modified subscription", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({ modified_at: null })
    );

    expect(snapshot.modifiedAt).toStrictEqual(new Date("2026-10-25T00:00:00Z"));
  });

  it("treats a scheduled end date as ending", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({ ends_at: "2026-11-25T00:00:00Z" })
    );

    expect(snapshot.cancelAtPeriodEnd).toBeTruthy();
  });

  it("leaves unknown products and missing external ids as null", () => {
    const snapshot = toSubscriptionSnapshot(
      subscription({
        customer: { external_id: null, id: "cus_dashboard" },
        product: { metadata: { [PLAN_METADATA_KEY]: "legacy" } },
      })
    );

    expect(snapshot.plan).toBeNull();
    expect(snapshot.organizationId).toBeNull();
  });
});

describe(getSubscriptionFromEvent, () => {
  it("reads the subscription of lifecycle events", async () => {
    const event = await createTestEvent({
      data: subscription({ id: "sub_xyz" }),
      type: "subscription.revoked",
    });

    expect(getSubscriptionFromEvent(event)?.id).toBe("sub_xyz");
  });

  it("ignores unrelated events", async () => {
    const event = await createTestEvent({
      data: { id: "ord_1" },
      type: "order.paid",
    });

    expect(getSubscriptionFromEvent(event)).toBeNull();
  });
});
