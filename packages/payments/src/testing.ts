import { verifyWebhookEvent } from "./webhook";
import type { PolarWebhookEvent, WebhookHeaders } from "./webhook";

/** Secret test buatan untuk semua test; bukan milik akun Polar mana pun. */
export const TEST_WEBHOOK_SECRET = "polar_whs_test_secret";

const MS_PER_SECOND = 1000;

/**
 * Header Standard Webhooks untuk payload, seperti yang dikirim Polar: HMAC
 * SHA-256 atas `<id>.<timestamp>.<body>` dengan secret sebagai kunci UTF-8
 * (salah satu bentuk kunci yang diterima `validateEvent`).
 */
export const signWebhookPayload = async ({
  id = "msg_test",
  payload,
  secret = TEST_WEBHOOK_SECRET,
  timestamp = Math.floor(Date.now() / MS_PER_SECOND),
}: {
  id?: string;
  payload: string;
  secret?: string;
  /** Detik Unix; default sekarang. */
  timestamp?: number;
}): Promise<WebhookHeaders> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${id}.${timestamp}.${payload}`)
  );
  const encoded = btoa(String.fromCodePoint(...new Uint8Array(signature)));
  return {
    "webhook-id": id,
    "webhook-signature": `v1,${encoded}`,
    "webhook-timestamp": String(timestamp),
  };
};

/**
 * Event bertipe lengkap dari objek contoh. Lewat jalur verifikasi yang sama
 * dengan produksi, jadi test tidak perlu membuat event dengan cast.
 */
export const createTestEvent = async (
  body: Record<string, unknown>
): Promise<PolarWebhookEvent> => {
  const payload = JSON.stringify(body);
  const verification = await verifyWebhookEvent({
    headers: await signWebhookPayload({ payload }),
    payload,
    secret: TEST_WEBHOOK_SECRET,
  });
  if (verification.result !== "valid") {
    throw new Error(`Test event failed verification: ${verification.result}`);
  }
  return verification.event;
};
