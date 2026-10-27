import { paidPlanSchema } from "@bermula/core/plans";
import { z } from "zod";

/** Aksi di halaman tagihan; dikirim sebagai field `intent` tiap form. */
export const BILLING_INTENT = {
  checkout: "checkout",
  portal: "portal",
} as const;

export const billingActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal(BILLING_INTENT.checkout),
    plan: paidPlanSchema,
  }),
  z.object({ intent: z.literal(BILLING_INTENT.portal) }),
]);

/** Query `?checkout=` saat Polar mengarahkan kembali ke halaman tagihan. */
export const CHECKOUT_RESULT = {
  cancel: "cancel",
  success: "success",
} as const;

export type CheckoutResult =
  (typeof CHECKOUT_RESULT)[keyof typeof CHECKOUT_RESULT];

export const readCheckoutResult = (
  searchParams: URLSearchParams
): CheckoutResult | null => {
  const value = searchParams.get("checkout");
  return value === CHECKOUT_RESULT.success || value === CHECKOUT_RESULT.cancel
    ? value
    : null;
};
