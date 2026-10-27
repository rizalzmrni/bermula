import { describe, expect, it } from "vitest";

import { formatCurrency } from "./format";
import {
  PAID_PLANS,
  PLAN,
  PLANS,
  SUBSCRIPTION_STATUS,
  formatPlanPrice,
  getPlan,
  isEntitledStatus,
  resolveEffectivePlan,
  toPaidPlan,
} from "./plans";

describe("plan catalog", () => {
  it("defines every plan id exactly once with one highlighted plan", () => {
    const ids = PLANS.map((plan) => plan.id);

    expect([...ids].toSorted()).toStrictEqual(Object.values(PLAN).toSorted());
    expect(PLANS.filter((plan) => plan.highlighted)).toHaveLength(1);
  });

  it("prices only paid plans", () => {
    for (const plan of PLANS) {
      expect(plan.monthlyPrice > 0).toBe(
        (PAID_PLANS as readonly string[]).includes(plan.id)
      );
    }
  });
});

// "Rp", spasi (biasa atau tak terputus dari `Intl`), titik ribuan, tanpa desimal.
const PRICE_PATTERN = /^Rp\s149\.000$/u;

describe(formatPlanPrice, () => {
  it("labels a zero price as free", () => {
    expect(formatPlanPrice(0)).toBe("Gratis");
  });

  it("formats paid prices as rupiah without decimals", () => {
    expect(formatPlanPrice(149_000)).toBe(formatCurrency(149_000));
    expect(formatPlanPrice(149_000)).toMatch(PRICE_PATTERN);
  });
});

describe(getPlan, () => {
  it("returns the plan definition", () => {
    expect(getPlan(PLAN.pro).name).toBe("Pro");
  });
});

describe(toPaidPlan, () => {
  it("accepts every paid plan", () => {
    for (const plan of PAID_PLANS) {
      expect(toPaidPlan(plan)).toBe(plan);
    }
  });

  it("rejects the free plan and unknown values", () => {
    expect(toPaidPlan(PLAN.free)).toBeNull();
    expect(toPaidPlan("pro_monthly")).toBeNull();
    expect(toPaidPlan(1)).toBeNull();
    expect(toPaidPlan(null)).toBeNull();
  });
});

describe(isEntitledStatus, () => {
  it("keeps access while payment is being retried", () => {
    expect(isEntitledStatus(SUBSCRIPTION_STATUS.active)).toBeTruthy();
    expect(isEntitledStatus(SUBSCRIPTION_STATUS.trialing)).toBeTruthy();
    expect(isEntitledStatus(SUBSCRIPTION_STATUS.pastDue)).toBeTruthy();
  });

  it("removes access for ended or unpaid subscriptions", () => {
    for (const status of [
      SUBSCRIPTION_STATUS.canceled,
      SUBSCRIPTION_STATUS.incomplete,
      SUBSCRIPTION_STATUS.incompleteExpired,
      SUBSCRIPTION_STATUS.paused,
      SUBSCRIPTION_STATUS.unpaid,
    ]) {
      expect(isEntitledStatus(status)).toBeFalsy();
    }
  });
});

describe(resolveEffectivePlan, () => {
  it("falls back to free without an entitled subscription", () => {
    expect(resolveEffectivePlan(null)).toBe(PLAN.free);
    expect(
      resolveEffectivePlan({
        plan: PLAN.pro,
        status: SUBSCRIPTION_STATUS.canceled,
      })
    ).toBe(PLAN.free);
  });

  it("uses the subscribed plan while entitled", () => {
    expect(
      resolveEffectivePlan({
        plan: PLAN.business,
        status: SUBSCRIPTION_STATUS.active,
      })
    ).toBe(PLAN.business);
  });
});
