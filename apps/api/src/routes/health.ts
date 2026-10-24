import { createRoute, z } from "@hono/zod-openapi";

import { createRouter } from "../lib/router";

const HealthSchema = z.object({ status: z.literal("ok") }).openapi("Health");

const healthRoute = createRoute({
  description:
    "Untuk uptime monitor. Tidak menyentuh database atau layanan eksternal.",
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: { "application/json": { schema: HealthSchema } },
      description: "Worker berjalan.",
    },
  },
  summary: "Cek status",
  tags: ["System"],
});

export const healthRoutes = createRouter().openapi(healthRoute, (c) =>
  c.json({ status: "ok" as const }, 200)
);
