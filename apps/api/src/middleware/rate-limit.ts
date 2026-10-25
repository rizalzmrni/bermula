import { createMiddleware } from "hono/factory";

import { ApiError } from "../lib/errors";
import type { AppEnv } from "../types";

/** Nama binding Rate Limiting di `wrangler.jsonc`. */
type RateLimitBinding = "AUTH_RATE_LIMIT" | "API_RATE_LIMIT";

/**
 * Batas per IP lewat binding Rate Limiting Workers; hitungannya dibagi antar
 * isolate, tidak seperti penghitung di memori. Batas & periode diatur di
 * `wrangler.jsonc`.
 */
export const rateLimit = (binding: RateLimitBinding) =>
  createMiddleware<AppEnv>(async (c, next) => {
    // Di belakang Cloudflare hanya header ini yang tidak bisa dipalsukan klien.
    const key = c.req.header("cf-connecting-ip") ?? "unknown";
    const { success } = await c.env[binding].limit({ key });

    if (!success) {
      throw new ApiError({
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Coba lagi dalam satu menit.",
        status: 429,
      });
    }

    return next();
  });
