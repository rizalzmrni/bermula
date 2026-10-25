import { Stripe } from "stripe";

export type StripeEvent = Stripe.Event;

/**
 * Verifikasi signature webhook dari body **mentah** (byte asli yang
 * ditandatangani Stripe). Versi async + Web Crypto karena `constructEvent`
 * sinkron bergantung pada crypto Node. `null` bila signature tidak valid atau
 * timestamp di luar toleransi (default SDK 5 menit).
 */
export const verifyWebhookEvent = async ({
  payload,
  secret,
  signature,
}: {
  payload: string;
  secret: string;
  signature: string;
}): Promise<StripeEvent | null> => {
  try {
    return await Stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return null;
    }
    throw error;
  }
};
