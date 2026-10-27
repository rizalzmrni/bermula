import type { ApiEnv } from "@bermula/env/api";
import { createBetterStackTransport } from "@bermula/observability/better-stack";
import { createLogger } from "@bermula/observability/logger";
import type { LogFields, LogTransport } from "@bermula/observability/logger";
import { createPostHogExceptionCapture } from "@bermula/observability/posthog";
import { createPolarClient } from "@bermula/payments/client";
import { createPolarGateway } from "@bermula/payments/gateway";
import { createR2S3Storage } from "@bermula/storage/r2-s3-storage";

// Layanan yang dipakai bersama handler `fetch` (lewat `contextMiddleware`) dan
// `scheduled`. Keduanya baru punya env saat dipanggil, jadi berupa factory.

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

export const createApiLogger = (env: ApiEnv, fields: LogFields) =>
  createLogger({
    fields,
    minLevel: env.LOG_LEVEL,
    service: SERVICE,
    transports: buildTransports(env),
  });

/** `undefined` bila PostHog belum dikonfigurasi. */
export const createCaptureException = (env: ApiEnv) =>
  env.POSTHOG_PROJECT_TOKEN && env.POSTHOG_HOST
    ? createPostHogExceptionCapture({
        host: env.POSTHOG_HOST,
        projectToken: env.POSTHOG_PROJECT_TOKEN,
        service: SERVICE,
      })
    : undefined;

/**
 * Lewat S3 API, bukan binding: presigned URL & operasi server harus melihat
 * bucket yang sama, juga di `wrangler dev` (binding lokal = bucket simulasi).
 */
export const createStorage = (env: ApiEnv) =>
  createR2S3Storage({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    accountId: env.R2_ACCOUNT_ID,
    bucketName: env.R2_BUCKET_NAME,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

/** `undefined` bila Polar belum dikonfigurasi (pasangan env opsional). */
export const createPayments = (env: ApiEnv) =>
  env.POLAR_ACCESS_TOKEN
    ? createPolarGateway(
        createPolarClient({
          accessToken: env.POLAR_ACCESS_TOKEN,
          server: env.POLAR_SERVER,
        })
      )
    : undefined;
