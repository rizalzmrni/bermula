import { OpenAPIHono } from "@hono/zod-openapi";

import { errorHandler, notFoundHandler, validationHook } from "./lib/errors";
import { contextMiddleware } from "./middleware/context";
import { corsMiddleware } from "./middleware/cors";
import { rateLimit } from "./middleware/rate-limit";
import { registerDocs } from "./openapi";
import { documentRoutes, imageRoutes } from "./routes/files";
import { healthRoutes } from "./routes/health";
import { meRoutes } from "./routes/me";
import type { AppEnv } from "./types";

const app = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

// Urutan penting: context (env, logger, auth) → CORS (butuh env) → rate limit.
// Preflight OPTIONS dijawab CORS sebelum rate limit, jadi tidak ikut terhitung.
app.use("*", contextMiddleware);
app.use("*", corsMiddleware);
app.use("/api/auth/*", rateLimit("AUTH_RATE_LIMIT"));
app.use("/api/*", rateLimit("API_RATE_LIMIT"));

// Sebelum handler auth: guard `/api/auth/open-api/*` harus jalan lebih dulu.
registerDocs(app);

app.on(["GET", "POST"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

app.onError(errorHandler);
app.notFound(notFoundHandler);

// Dirangkai berantai agar `AppType` memuat semua route untuk klien `hc`.
const routes = app
  .route("/", healthRoutes)
  .route("/", meRoutes)
  .route("/", imageRoutes)
  .route("/", documentRoutes);

export type AppType = typeof routes;
export type { Bindings } from "./types";

export default app;
