import { describe, expect, it } from "vitest";

import { getSubscriptionBadge, getSubscriptionStatusLabel } from "./labels";

describe(getSubscriptionStatusLabel, () => {
  it("translates known Polar statuses", () => {
    expect(getSubscriptionStatusLabel("active")).toStrictEqual({
      label: "Aktif",
      variant: "default",
    });
    expect(getSubscriptionStatusLabel("past_due").variant).toBe("destructive");
  });

  it("shows an unknown status as is", () => {
    expect(getSubscriptionStatusLabel("future_status")).toStrictEqual({
      label: "future_status",
      variant: "outline",
    });
  });

  it("does not treat object prototype keys as statuses", () => {
    expect(getSubscriptionStatusLabel("toString").label).toBe("toString");
  });
});

describe(getSubscriptionBadge, () => {
  const subscription = {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-11-27T16:34:50Z",
    status: "active",
  };

  it("uses the status label while the subscription renews", () => {
    expect(getSubscriptionBadge(subscription)).toStrictEqual({
      label: "Aktif",
      variant: "default",
    });
  });

  it("shows the end date once a running subscription is canceled", () => {
    expect(
      getSubscriptionBadge({ ...subscription, cancelAtPeriodEnd: true })
    ).toStrictEqual({ label: "Berakhir 27 Nov", variant: "secondary" });
    expect(
      getSubscriptionBadge({
        ...subscription,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: null,
        status: "trialing",
      })
    ).toStrictEqual({ label: "Akan berakhir", variant: "secondary" });
  });

  it("keeps payment problems and ended subscriptions as they are", () => {
    expect(
      getSubscriptionBadge({
        ...subscription,
        cancelAtPeriodEnd: true,
        status: "past_due",
      }).variant
    ).toBe("destructive");
    expect(
      getSubscriptionBadge({
        ...subscription,
        cancelAtPeriodEnd: true,
        status: "canceled",
      }).label
    ).toBe("Berakhir");
  });
});
