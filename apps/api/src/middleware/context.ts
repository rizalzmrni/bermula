import { createAuth } from "@bermula/auth/server";
import { createDb } from "@bermula/db/client";
import { createResendTransport } from "@bermula/email/resend-transport";
import { createEmailSender } from "@bermula/email/sender";
import { createApiEnv } from "@bermula/env/api";
import type { ApiEnv } from "@bermula/env/api";
import { createBetterStackTransport } from "@bermula/observability/better-stack";
import { createLogger } from "@bermula/observability/logger";
import type { LogTransport } from "@bermula/observability/logger";
import { createPostHogExceptionCapture } from "@bermula/observability/posthog";
import { createR2S3Storage } from "@bermula/storage/r2-s3-storage";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

const SERVICE = "api";

const buildTransports = (env: ApiEnv): LogTransport[] =>
  env.BETTER_STACK_SOURCE_TOKEN && env.BETTER_STACK_INGESTING_URL
    ? [
        createBetterStackTransport({
          ingestingUrl: env.BETTER_STACK_INGESTING_URL,
          sourceToken: env.BETTER_STACK_SOURCE_TOKEN,
        }),
      ]
    : [];

const buildCaptureException = (env: ApiEnv) =>
  env.POSTHOG_PROJECT_TOKEN && env.POSTHOG_HOST
    ? createPostHogExceptionCapture({
        host: env.POSTHOG_HOST,
        projectToken: env.POSTHOG_PROJECT_TOKEN,
        service: SERVICE,
      })
    : undefined;

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

  const logger = createLogger({
    // `cf-ray` mengaitkan log dengan request di dashboard Cloudflare.
    fields: { requestId: c.req.header("cf-ray") ?? crypto.randomUUID() },
    minLevel: env.LOG_LEVEL,
    service: SERVICE,
    transports: buildTransports(env),
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
  c.set("captureException", buildCaptureException(env));
  // Lewat S3 API, bukan binding: presigned URL & operasi server harus melihat
  // bucket yang sama, juga di `wrangler dev` (binding lokal = bucket simulasi).
  c.set(
    "storage",
    createR2S3Storage({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      accountId: env.R2_ACCOUNT_ID,
      bucketName: env.R2_BUCKET_NAME,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    })
  );

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
