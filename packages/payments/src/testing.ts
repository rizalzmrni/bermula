import { Stripe } from "stripe";

import { verifyWebhookEvent } from "./webhook";
import type { StripeEvent } from "./webhook";

/** Secret test buatan untuk semua test; bukan milik akun Stripe mana pun. */
export const TEST_WEBHOOK_SECRET = "whsec_test_secret";

/** Header `stripe-signature` untuk payload, persis seperti yang dikirim Stripe. */
export const signWebhookPayload = (
  payload: string,
  secret = TEST_WEBHOOK_SECRET
) =>
  Stripe.webhooks.generateTestHeaderStringAsync({
    cryptoProvider: Stripe.createSubtleCryptoProvider(),
    payload,
    secret,
  });

/**
 * Event bertipe lengkap dari objek contoh. Lewat jalur verifikasi yang sama
 * dengan produksi, jadi test tidak perlu membuat `Stripe.Event` dengan cast.
 */
export const createTestEvent = async (
  body: Record<string, unknown>
): Promise<StripeEvent> => {
  const payload = JSON.stringify({ object: "event", ...body });
  const event = await verifyWebhookEvent({
    payload,
    secret: TEST_WEBHOOK_SECRET,
    signature: await signWebhookPayload(payload),
  });
  if (!event) {
    throw new Error("Test event failed verification");
  }
  return event;
};
