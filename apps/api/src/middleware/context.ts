import { createAuth } from "@bermula/auth/server";
import { createDb } from "@bermula/db/client";
import { createResendTransport } from "@bermula/email/resend-transport";
import { createEmailSender } from "@bermula/email/sender";
import { createApiEnv } from "@bermula/env/api";
import { createMiddleware } from "hono/factory";

import {
  createApiLogger,
  createCaptureException,
  createStorage,
} from "../lib/runtime";
import type { AppEnv } from "../types";

/**
 * Menyiapkan layanan per request. Di Workers, env & `waitUntil` baru ada saat
 * request, dan state di variabel modul dibagi antar-request dalam satu isolate,
 * jadi semuanya dibuat di sini, bukan saat modul dimuat.
 */
export const contextMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const startedAt = Date.now();
  const env = createApiEnv(c.env);
  const waitUntil = (promise: Promise<unknown>) =>
    c.executionCtx.waitUntil(promise);

  const logger = createApiLogger(env, {
    // `cf-ray` mengaitkan log dengan request di dashboard Cloudflare.
    requestId: c.req.header("cf-ray") ?? crypto.randomUUID(),
  });
  const db = createDb({ databaseUrl: env.DATABASE_URL });
  const emails = createEmailSender({
    from: env.EMAIL_FROM,
    transport: createResendTransport({ apiKey: env.RESEND_API_KEY }),
  });

  c.set("env", env);
  c.set("logger", logger);
  c.set("db", db);
  c.set("auth", createAuth({ db, emails, env, logger, waitUntil }));
  c.set("captureException", createCaptureException(env));
  c.set("storage", createStorage(env));

  try {
    return await next();
  } finally {
    logger.info("Request completed", {
      durationMs: Date.now() - startedAt,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
    });
    // Pengiriman log ke BetterStack tidak boleh menahan respons.
    waitUntil(logger.flush());
  }
});
