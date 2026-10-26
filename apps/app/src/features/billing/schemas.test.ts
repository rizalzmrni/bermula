import { describe, expect, it } from "vitest";

import { billingActionSchema, readCheckoutResult } from "./schemas";

describe(readCheckoutResult, () => {
  it("reads the result Stripe redirects back with", () => {
    expect(readCheckoutResult(new URLSearchParams("checkout=success"))).toBe(
      "success"
    );
    expect(readCheckoutResult(new URLSearchParams("checkout=cancel"))).toBe(
      "cancel"
    );
  });

  it("ignores missing or unknown values", () => {
    expect(readCheckoutResult(new URLSearchParams())).toBeNull();
    expect(readCheckoutResult(new URLSearchParams("checkout=x"))).toBeNull();
  });
});

describe("billing action schema", () => {
  it("accepts only paid plans for checkout", () => {
    expect(
      billingActionSchema.safeParse({ intent: "checkout", plan: "pro" }).success
    ).toBeTruthy();
    expect(
      billingActionSchema.safeParse({ intent: "checkout", plan: "free" })
        .success
    ).toBeFalsy();
    expect(
      billingActionSchema.safeParse({ intent: "portal" }).success
    ).toBeTruthy();
  });
});
