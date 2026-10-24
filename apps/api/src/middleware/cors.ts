import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

const PREFLIGHT_MAX_AGE_SECONDS = 600;

/**
 * App & web berbeda origin dengan api, dan cookie sesi harus ikut terkirim,
 * jadi origin wajib eksplisit dari `CORS_ORIGINS` (bukan `*`).
 */
export const corsMiddleware = createMiddleware<AppEnv>((c, next) =>
  cors({
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
    origin: (origin) =>
      c.var.env.CORS_ORIGINS.includes(origin) ? origin : null,
  })(c, next)
);
