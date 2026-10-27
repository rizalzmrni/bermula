import { PLAN, SUBSCRIPTION_STATUS, paidPlanSchema } from "@bermula/core/plans";
import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "../lib/errors";
import { createRouter } from "../lib/router";
import { requireAuth } from "../middleware/require-auth";
import { SESSION_SECURITY } from "../openapi";
import {
  createCheckoutSession,
  createPortalSession,
  getBillingOverview,
  requirePayments,
} from "../services/billing";

const PlanSchema = paidPlanSchema.openapi({ example: PLAN.pro });

const BillingOverviewSchema = z
  .object({
    billingEnabled: z.boolean().openapi({
      description: "`false` bila Polar belum dikonfigurasi di server.",
    }),
    canManage: z.boolean().openapi({
      description: "Pengguna boleh membuka Checkout/Portal (owner atau admin).",
    }),
    hasBillingAccount: z.boolean().openapi({
      description: "Organisasi sudah punya customer Polar (Portal tersedia).",
    }),
    plan: z.enum([PLAN.free, PLAN.pro, PLAN.business]).openapi({
      description: "Paket yang berlaku untuk otorisasi fitur.",
      example: PLAN.pro,
    }),
    subscription: z
      .object({
        cancelAtPeriodEnd: z.boolean().openapi({
          description: "Langganan dijadwalkan berhenti.",
        }),
        currentPeriodEnd: z.iso.datetime().nullable(),
        plan: PlanSchema,
        status: z.string().openapi({
          description: "Status Polar apa adanya.",
          example: SUBSCRIPTION_STATUS.active,
        }),
      })
      .nullable()
      .openapi({
        description:
          "Langganan yang masih berhak, atau yang terakhir bila sudah berakhir.",
      }),
  })
  .openapi("BillingOverview");

const CheckoutRequestSchema = z
  .object({ plan: PlanSchema })
  .openapi("CheckoutRequest");

const RedirectSchema = z
  .object({
    url: z.url().openapi({ description: "Arahkan browser ke URL Polar ini." }),
  })
  .openapi("BillingRedirect");

const COMMON_ERRORS = {
  401: errorResponse("Belum login."),
  403: errorResponse(
    "Tidak ada organisasi aktif, bukan anggotanya, atau bukan owner/admin (`FORBIDDEN`)."
  ),
  429: errorResponse("Terlalu banyak permintaan."),
};

const shared = {
  security: SESSION_SECURITY,
  tags: ["Billing"],
};

const getOverviewRoute = createRoute({
  ...shared,
  description:
    "Paket dan langganan organisasi aktif, dibaca dari Postgres (disinkronkan webhook Polar). Bisa dibaca semua anggota.",
  method: "get",
  middleware: [requireAuth] as const,
  path: "/api/billing/subscription",
  responses: {
    200: {
      content: { "application/json": { schema: BillingOverviewSchema } },
      description: "Ringkasan tagihan.",
    },
    ...COMMON_ERRORS,
  },
  summary: "Langganan organisasi",
});

const createCheckoutRoute = createRoute({
  ...shared,
  description:
    "Membuat sesi Polar Checkout untuk paket berbayar. Mata uang dan pajak dipilih Polar dari IP pengguna (`cf-connecting-ip`). Setelah bayar, Polar mengarahkan kembali ke `/settings/billing?checkout=success`; status langganan diperbarui oleh webhook.",
  method: "post",
  middleware: [requireAuth] as const,
  path: "/api/billing/checkout-sessions",
  request: {
    body: {
      content: { "application/json": { schema: CheckoutRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: RedirectSchema } },
      description: "URL halaman Checkout.",
    },
    400: errorResponse("Paket tidak valid."),
    409: errorResponse(
      "Organisasi sudah berlangganan (`ALREADY_SUBSCRIBED`); ubah paket lewat Portal."
    ),
    503: errorResponse(
      "Polar belum dikonfigurasi (`BILLING_NOT_CONFIGURED`) atau produk paket belum ada (`PRICE_NOT_CONFIGURED`)."
    ),
    ...COMMON_ERRORS,
  },
  summary: "Mulai Checkout",
});

const createPortalRoute = createRoute({
  ...shared,
  description:
    "Membuat sesi Polar Customer Portal untuk mengganti paket, metode pembayaran, atau membatalkan langganan.",
  method: "post",
  middleware: [requireAuth] as const,
  path: "/api/billing/portal-sessions",
  responses: {
    201: {
      content: { "application/json": { schema: RedirectSchema } },
      description: "URL Customer Portal.",
    },
    409: errorResponse(
      "Organisasi belum punya akun tagihan (`NO_BILLING_ACCOUNT`)."
    ),
    503: errorResponse("Polar belum dikonfigurasi (`BILLING_NOT_CONFIGURED`)."),
    ...COMMON_ERRORS,
  },
  summary: "Buka Customer Portal",
});

export const billingRoutes = createRouter()
  .openapi(getOverviewRoute, async (c) => {
    const overview = await getBillingOverview({
      billingEnabled: c.var.payments !== undefined,
      db: c.var.db,
      organizationId: c.var.organizationId,
      role: c.var.membership.role,
    });
    return c.json(overview, 200);
  })
  .openapi(createCheckoutRoute, async (c) => {
    const session = await createCheckoutSession({
      appUrl: c.var.env.APP_URL,
      // Diteruskan apps/app dari request browser asli lewat Service Binding.
      customerIpAddress: c.req.header("cf-connecting-ip"),
      db: c.var.db,
      organizationId: c.var.organizationId,
      payments: requirePayments(c.var.payments),
      plan: c.req.valid("json").plan,
      role: c.var.membership.role,
    });
    return c.json(session, 201);
  })
  .openapi(createPortalRoute, async (c) => {
    const session = await createPortalSession({
      appUrl: c.var.env.APP_URL,
      db: c.var.db,
      organizationId: c.var.organizationId,
      payments: requirePayments(c.var.payments),
      role: c.var.membership.role,
    });
    return c.json(session, 201);
  });
