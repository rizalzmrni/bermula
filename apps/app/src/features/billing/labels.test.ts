import { describe, expect, it } from "vitest";

import { getSubscriptionStatusLabel } from "./labels";

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
