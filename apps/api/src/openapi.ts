import { APP_NAME } from "@bermula/core/brand";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { createMiddleware } from "hono/factory";

import { AUTH_BASE_PATH, mergeAuthDocument } from "./lib/auth-openapi";
import { notFoundHandler } from "./lib/errors";
import type { AppEnv } from "./types";

const SESSION_SCHEME = "sessionCookie";

/** Dipasang di `createRoute({ security })` untuk route yang butuh login. */
export const SESSION_SECURITY = [{ [SESSION_SCHEME]: [] }];

/** Dokumentasi membuka peta endpoint, jadi hanya aktif bila `API_DOCS_ENABLED=true`. */
const docsGuard = createMiddleware<AppEnv>((c, next) => {
  if (!c.var.env.API_DOCS_ENABLED) {
    return Promise.resolve(notFoundHandler(c));
  }
  return next();
});

/** `GET /openapi.json` (OpenAPI 3.1 dari `createRoute`) dan `GET /docs` (Scalar). */
export const registerDocs = (app: OpenAPIHono<AppEnv>) => {
  app.openAPIRegistry.registerComponent("securitySchemes", SESSION_SCHEME, {
    description:
      "Cookie sesi better-auth (`better-auth.session_token`, berawalan `__Secure-` di HTTPS). Didapat dari endpoint `/api/auth/*`.",
    in: "cookie",
    name: "better-auth.session_token",
    type: "apiKey",
  });

  app.use("/openapi.json", docsGuard);
  app.use("/docs", docsGuard);
  // Endpoint skema plugin `openAPI` better-auth membuka peta endpoint yang sama.
  app.use(`${AUTH_BASE_PATH}/open-api/*`, docsGuard);

  // Bukan `app.doc31`: dokumen dari `createRoute` digabung dengan skema
  // better-auth, yang baru bisa dibuat dari instance auth per request.
  app.get("/openapi.json", async (c) => {
    const document = app.getOpenAPI31Document({
      info: { title: `${APP_NAME} API`, version: "0.1.0" },
      openapi: "3.1.0",
      servers: [{ url: c.var.env.BETTER_AUTH_URL }],
    });
    const authDocument = await c.var.auth.api.generateOpenAPISchema();
    return c.json(mergeAuthDocument(document, authDocument));
  });

  app.get(
    "/docs",
    Scalar({ pageTitle: `${APP_NAME} API`, url: "/openapi.json" })
  );
};
