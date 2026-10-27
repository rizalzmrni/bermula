import { webhooks } from "@polar-sh/sdk/2026-10";

export type PolarWebhookEvent = webhooks.WebhookPayload;

/** Header Standard Webhooks yang ditandatangani Polar. */
export const WEBHOOK_HEADER = {
  id: "webhook-id",
  signature: "webhook-signature",
  timestamp: "webhook-timestamp",
} as const;

export type WebhookHeaders = Record<
  (typeof WEBHOOK_HEADER)[keyof typeof WEBHOOK_HEADER],
  string
>;

export const WEBHOOK_VERIFICATION = {
  /** Signature salah, header hilang, atau timestamp di luar toleransi 5 menit. */
  invalid: "invalid",
  /** Signature cocok tetapi body bukan event yang bisa dibaca. */
  malformed: "malformed",
  /** Event asli bertipe yang tidak dikenal versi API SDK ini. */
  unsupported: "unsupported",
  valid: "valid",
} as const;

export type WebhookVerification =
  | { result: typeof WEBHOOK_VERIFICATION.valid; event: PolarWebhookEvent }
  | {
      result: typeof WEBHOOK_VERIFICATION.unsupported;
      eventType: string | null;
    }
  | { result: typeof WEBHOOK_VERIFICATION.invalid }
  | { result: typeof WEBHOOK_VERIFICATION.malformed };

/**
 * Verifikasi signature webhook dari body **mentah** (byte asli yang
 * ditandatangani Polar) lewat `webhooks.validateEvent` SDK (Web Crypto, jalan
 * di Workers). Kesalahan dari pemanggil dikembalikan sebagai hasil, bukan
 * dilempar, agar route bisa memetakannya ke status HTTP.
 */
export const verifyWebhookEvent = async ({
  headers,
  payload,
  secret,
}: {
  headers: WebhookHeaders;
  payload: string;
  secret: string;
}): Promise<WebhookVerification> => {
  try {
    const event = await webhooks.validateEvent(payload, headers, secret);
    return { event, result: WEBHOOK_VERIFICATION.valid };
  } catch (error) {
    if (error instanceof webhooks.PolarWebhookVerificationError) {
      return { result: WEBHOOK_VERIFICATION.invalid };
    }
    if (error instanceof webhooks.PolarWebhookUnknownTypeError) {
      return {
        eventType: error.eventType,
        result: WEBHOOK_VERIFICATION.unsupported,
      };
    }
    if (error instanceof webhooks.PolarWebhookError) {
      return { result: WEBHOOK_VERIFICATION.malformed };
    }
    throw error;
  }
};
