import { formatCurrency } from "@bermula/core/format";
import { describe, expect, it } from "vitest";

import { formatPlanPrice, PLANS } from "./plans";

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

describe("plan catalog", () => {
  it("has unique ids and exactly one highlighted plan", () => {
    const ids = new Set(PLANS.map((plan) => plan.id));

    expect(ids.size).toBe(PLANS.length);
    expect(PLANS.filter((plan) => plan.highlighted)).toHaveLength(1);
  });
});
