import {
  WEBHOOK_HEADER,
  WEBHOOK_VERIFICATION,
  verifyWebhookEvent,
} from "@bermula/payments/webhook";
import { createRoute, z } from "@hono/zod-openapi";

import { ApiError, errorResponse } from "../lib/errors";
import { createRouter } from "../lib/router";
import { processWebhookEvent, requireWebhookSecret } from "../services/billing";

const HeadersSchema = z.object({
  [WEBHOOK_HEADER.id]: z.string().min(1).openapi({
    description:
      "ID pengiriman; sama untuk setiap pengiriman ulang event yang sama.",
    example: "msg_2n8u3Xc0WvJ1",
  }),
  [WEBHOOK_HEADER.signature]: z.string().min(1).openapi({
    description: "Signature HMAC (Standard Webhooks) atas body mentah.",
    example: "v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=",
  }),
  [WEBHOOK_HEADER.timestamp]: z.string().min(1).openapi({
    description: "Detik Unix saat dikirim; ditolak bila selisih >5 menit.",
    example: "1795564800",
  }),
});

const ReceivedSchema = z
  .object({ received: z.literal(true) })
  .openapi("WebhookReceived");

// Body sengaja tidak dideklarasikan sebagai skema: validator body akan membaca
// dan mem-parse JSON, padahal signature harus dicek atas byte mentah.
const polarWebhookRoute = createRoute({
  description:
    "Dipanggil Polar, bukan klien. Tanpa sesi: keasliannya dijamin header Standard Webhooks (`webhook-id`, `webhook-timestamp`, `webhook-signature`) atas body mentah (event Polar JSON). Pengiriman yang sama hanya diproses sekali; tipe event yang tidak dikenal diterima tanpa diproses. Tidak terkena rate limit per IP.",
  method: "post",
  path: "/api/webhooks/polar",
  request: { headers: HeadersSchema },
  responses: {
    200: {
      content: { "application/json": { schema: ReceivedSchema } },
      description:
        "Event diterima (diproses, duplikat, usang, atau tidak relevan).",
    },
    400: errorResponse(
      "Header Standard Webhooks hilang (`VALIDATION_ERROR`) atau body bertanda tangan bukan event yang valid (`INVALID_PAYLOAD`)."
    ),
    403: errorResponse(
      "Signature atau timestamp tidak valid (`INVALID_SIGNATURE`)."
    ),
    503: errorResponse("Polar belum dikonfigurasi (`BILLING_NOT_CONFIGURED`)."),
  },
  summary: "Webhook Polar",
  tags: ["Webhooks"],
});

export const webhookRoutes = createRouter().openapi(
  polarWebhookRoute,
  async (c) => {
    const secret = requireWebhookSecret(c.var.env.POLAR_WEBHOOK_SECRET);
    const headers = c.req.valid("header");

    const verification = await verifyWebhookEvent({
      headers,
      payload: await c.req.text(),
      secret,
    });
    if (verification.result === WEBHOOK_VERIFICATION.invalid) {
      throw new ApiError({
        code: "INVALID_SIGNATURE",
        message: "Signature webhook tidak valid.",
        status: 403,
      });
    }
    if (verification.result === WEBHOOK_VERIFICATION.malformed) {
      throw new ApiError({
        code: "INVALID_PAYLOAD",
        message: "Body webhook bukan event yang valid.",
        status: 400,
      });
    }
    // Event asli dari tipe yang lebih baru dari versi API SDK: dibalas 2xx
    // agar Polar tidak terus mengirim ulang (dan menonaktifkan endpoint).
    if (verification.result === WEBHOOK_VERIFICATION.unsupported) {
      c.var.logger.warn("Unsupported Polar webhook event type", {
        type: verification.eventType,
      });
      return c.json({ received: true as const }, 200);
    }

    // Diproses sebelum membalas (bukan `waitUntil`): bila gagal, respons 500
    // membuat Polar mengirim ulang. Hanya query DB, tanpa panggilan ke Polar.
    const webhookId = headers[WEBHOOK_HEADER.id];
    const outcome = await processWebhookEvent({
      db: c.var.db,
      event: verification.event,
      logger: c.var.logger,
      webhookId,
    });
    c.var.logger.info("Polar webhook processed", {
      outcome,
      type: verification.event.type,
      webhookId,
    });
    return c.json({ received: true as const }, 200);
  }
);
