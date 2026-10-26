import { verifyWebhookEvent } from "@bermula/payments/webhook";
import { createRoute, z } from "@hono/zod-openapi";

import { ApiError, errorResponse } from "../lib/errors";
import { createRouter } from "../lib/router";
import { processWebhookEvent, requireWebhookConfig } from "../services/billing";

const SIGNATURE_HEADER = "stripe-signature";

const HeadersSchema = z.object({
  [SIGNATURE_HEADER]: z.string().min(1).openapi({
    description: "Signature HMAC dari Stripe atas body mentah.",
    example: "t=1795564800,v1=5257a869e7ec...",
  }),
});

const ReceivedSchema = z
  .object({ received: z.literal(true) })
  .openapi("WebhookReceived");

// Body sengaja tidak dideklarasikan sebagai skema: validator body akan membaca
// dan mem-parse JSON, padahal signature harus dicek atas byte mentah.
const stripeWebhookRoute = createRoute({
  description:
    "Dipanggil Stripe, bukan klien. Tanpa sesi: keasliannya dijamin header `stripe-signature` atas body mentah (event Stripe JSON). Event yang sama hanya diproses sekali. Tidak terkena rate limit per IP.",
  method: "post",
  path: "/api/webhooks/stripe",
  request: { headers: HeadersSchema },
  responses: {
    200: {
      content: { "application/json": { schema: ReceivedSchema } },
      description: "Event diterima (diproses, duplikat, atau tidak relevan).",
    },
    400: errorResponse(
      "Header signature hilang (`VALIDATION_ERROR`) atau tidak valid (`INVALID_SIGNATURE`)."
    ),
    503: errorResponse(
      "Stripe belum dikonfigurasi (`BILLING_NOT_CONFIGURED`)."
    ),
  },
  summary: "Webhook Stripe",
  tags: ["Webhooks"],
});

export const webhookRoutes = createRouter().openapi(
  stripeWebhookRoute,
  async (c) => {
    const { payments, secret } = requireWebhookConfig({
      payments: c.var.payments,
      secret: c.var.env.STRIPE_WEBHOOK_SECRET,
    });

    const event = await verifyWebhookEvent({
      payload: await c.req.text(),
      secret,
      signature: c.req.valid("header")[SIGNATURE_HEADER],
    });
    if (!event) {
      throw new ApiError({
        code: "INVALID_SIGNATURE",
        message: "Signature webhook tidak valid.",
        status: 400,
      });
    }

    // Diproses sebelum membalas (bukan `waitUntil`): bila gagal, respons 500
    // membuat Stripe mengirim ulang. Sync hanya satu panggilan Stripe + upsert.
    const outcome = await processWebhookEvent({
      db: c.var.db,
      event,
      logger: c.var.logger,
      payments,
    });
    c.var.logger.info("Stripe webhook processed", {
      eventId: event.id,
      outcome,
      type: event.type,
    });
    return c.json({ received: true as const }, 200);
  }
);
