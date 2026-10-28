import { OpenAPIHono } from "@hono/zod-openapi";

import { errorHandler, notFoundHandler, validationHook } from "./lib/errors";
import { contextMiddleware } from "./middleware/context";
import { corsMiddleware } from "./middleware/cors";
import { rateLimit } from "./middleware/rate-limit";
import { registerDocs } from "./openapi";
import { billingRoutes } from "./routes/billing";
import { documentRoutes, imageRoutes } from "./routes/files";
import { healthRoutes } from "./routes/health";
import { meRoutes } from "./routes/me";
import { organizationRoutes } from "./routes/organizations";
import { webhookRoutes } from "./routes/webhooks";
import { scheduled } from "./scheduled";
import type { AppEnv, Bindings } from "./types";

const WEBHOOK_PATH_PREFIX = "/api/webhooks/";
// Kelola organisasi (undang, ubah role, dst.) butuh sesi dan dipakai rutin
// oleh admin; batas ketat 10/menit untuk brute force login tidak relevan dan
// cepat habis di balik NAT kantor. Tetap ikut API_RATE_LIMIT.
const ORGANIZATION_AUTH_PATH_PREFIX = "/api/auth/organization/";

const app = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

// Urutan penting: context (env, logger, auth) → CORS (butuh env) → rate limit.
// Preflight OPTIONS dijawab CORS sebelum rate limit, jadi tidak ikut terhitung.
// Webhook datang dari sedikit IP milik Polar dan dijaga signature, jadi tidak
// ikut dibatasi per IP.
app.use("*", contextMiddleware);
app.use("*", corsMiddleware);
app.use(
  "/api/auth/*",
  rateLimit("AUTH_RATE_LIMIT", {
    exceptPrefixes: [ORGANIZATION_AUTH_PATH_PREFIX],
  })
);
app.use(
  "/api/*",
  rateLimit("API_RATE_LIMIT", { exceptPrefixes: [WEBHOOK_PATH_PREFIX] })
);

// Sebelum handler auth: guard `/api/auth/open-api/*` harus jalan lebih dulu.
registerDocs(app);

app.on(["GET", "POST"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

app.onError(errorHandler);
app.notFound(notFoundHandler);

// Dirangkai berantai agar `AppType` memuat semua route untuk klien `hc`.
const routes = app
  .route("/", healthRoutes)
  .route("/", meRoutes)
  .route("/", organizationRoutes)
  .route("/", imageRoutes)
  .route("/", documentRoutes)
  .route("/", billingRoutes)
  .route("/", webhookRoutes);

export type AppType = typeof routes;
export type { Bindings } from "./types";

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Bindings>;
