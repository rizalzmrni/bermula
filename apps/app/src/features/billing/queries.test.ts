import { describe, expect, it } from "vitest";

import {
  BILLING_AWAIT,
  BILLING_POLL_INTERVAL_MS,
  PORTAL_MAX_DATA_UPDATES,
  getBillingRefetchInterval,
} from "./queries";

describe(getBillingRefetchInterval, () => {
  it("does not poll without a pending return from Polar", () => {
    expect(
      getBillingRefetchInterval({
        awaiting: null,
        dataUpdateCount: 1,
        plan: "free",
      })
    ).toBeFalsy();
  });

  it("polls after checkout until the paid plan arrives", () => {
    const afterCheckout = {
      awaiting: BILLING_AWAIT.payment,
      dataUpdateCount: 5,
    };

    expect(getBillingRefetchInterval({ ...afterCheckout, plan: "free" })).toBe(
      BILLING_POLL_INTERVAL_MS
    );
    expect(
      getBillingRefetchInterval({ ...afterCheckout, plan: "pro" })
    ).toBeFalsy();
  });

  it("polls a limited number of times after the portal", () => {
    const afterPortal = {
      awaiting: BILLING_AWAIT.portal,
      plan: "pro" as const,
    };

    expect(
      getBillingRefetchInterval({ ...afterPortal, dataUpdateCount: 1 })
    ).toBe(BILLING_POLL_INTERVAL_MS);
    expect(
      getBillingRefetchInterval({
        ...afterPortal,
        dataUpdateCount: PORTAL_MAX_DATA_UPDATES,
      })
    ).toBeFalsy();
  });
});
