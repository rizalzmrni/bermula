import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { onValidationError, originListSchema, originSchema } from "./shared";

// Neon memberi URL `postgresql://`; `postgres://` juga diterima driver.
const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\//u;

// Sama dengan `LogLevel` di @bermula/observability; kecocokannya dicek saat
// apps/api meneruskan `env.LOG_LEVEL` ke `createLogger`.
const LOG_LEVEL_VALUES = ["debug", "info", "warn", "error"] as const;

// Domain cookie tanpa skema/port, mis. `example.com`; titik di depan opsional.
const COOKIE_DOMAIN_PATTERN = /^\.?[a-z0-9-]+(?:\.[a-z0-9-]+)+$/u;

// `noreply@example.com` atau `Nama <noreply@example.com>`, format yang diterima Resend.
const EMAIL_FROM_PATTERN =
  /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/u;

// API key Resend selalu berawalan `re_`; menangkap salah tempel lebih awal.
const RESEND_API_KEY_PATTERN = /^re_\S+$/u;

// Account ID Cloudflare & kredensial S3 API R2 berupa hex; menangkap salah tempel
// (mis. URL endpoint lengkap) lebih awal.
const R2_ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/u;
// Aturan nama bucket R2: 3–63 karakter, huruf kecil, angka, dan `-`.
const R2_BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/u;

// Secret key (`sk_`) atau restricted key (`rk_`) Stripe, test maupun live.
const STRIPE_SECRET_KEY_PATTERN = /^(?:sk|rk)_(?:test|live)_\S+$/u;
// Signing secret endpoint webhook (dashboard atau `stripe listen`).
const STRIPE_WEBHOOK_SECRET_PATTERN = /^whsec_\S+$/u;

// better-auth menolak secret yang lebih pendek di production.
const AUTH_SECRET_MIN_LENGTH = 32;

const server = {
  // Dokumentasi API publik membuka peta endpoint; aktif hanya bila diminta.
  API_DOCS_ENABLED: z.stringbool().default(false),
  APP_URL: originSchema,
  AUTH_COOKIE_DOMAIN: z
    .string()
    .regex(COOKIE_DOMAIN_PATTERN, "Harus domain, mis. example.com")
    .optional(),
  BETTER_AUTH_SECRET: z.string().min(AUTH_SECRET_MIN_LENGTH),
  BETTER_AUTH_URL: originSchema,
  BETTER_STACK_INGESTING_URL: z.url().optional(),
  BETTER_STACK_SOURCE_TOKEN: z.string().min(1).optional(),
  CORS_ORIGINS: originListSchema,
  DATABASE_URL: z.url().regex(POSTGRES_URL_PATTERN, "Harus URL postgresql://"),
  EMAIL_FROM: z
    .string()
    .regex(EMAIL_FROM_PATTERN, "Harus email, mis. Nama <noreply@example.com>"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(LOG_LEVEL_VALUES).default("info"),
  POSTHOG_HOST: originSchema.optional(),
  POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_ACCOUNT_ID: z
    .string()
    .regex(
      R2_ACCOUNT_ID_PATTERN,
      "Harus account ID Cloudflare (32 karakter hex)"
    ),
  R2_BUCKET_NAME: z
    .string()
    .regex(R2_BUCKET_NAME_PATTERN, "Harus nama bucket R2 yang valid"),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  RESEND_API_KEY: z
    .string()
    .regex(RESEND_API_KEY_PATTERN, "Harus API key Resend (re_...)"),
  STRIPE_SECRET_KEY: z
    .string()
    .regex(
      STRIPE_SECRET_KEY_PATTERN,
      "Harus secret key Stripe (sk_... / rk_...)"
    )
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(
      STRIPE_WEBHOOK_SECRET_PATTERN,
      "Harus signing secret webhook (whsec_...)"
    )
    .optional(),
  WEB_URL: originSchema,
};

// Integrasi opsional: dev lokal cukup memakai console, tetapi bila salah satu
// variabel pasangan diisi, pasangannya wajib ada agar tidak gagal diam-diam.
const OPTIONAL_PAIRS = [
  ["BETTER_STACK_SOURCE_TOKEN", "BETTER_STACK_INGESTING_URL"],
  ["POSTHOG_PROJECT_TOKEN", "POSTHOG_HOST"],
  ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  // Tanpa Stripe, endpoint billing membalas 503 (boilerplate tetap jalan).
  ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
] as const satisfies readonly (readonly [
  keyof typeof server,
  keyof typeof server,
])[];

export type ApiRuntimeEnv = Partial<Record<keyof typeof server, string>>;

/**
 * Di Workers, env baru tersedia saat request (`c.env`), bukan saat modul
 * dimuat. Panggil sekali per request di middleware, lalu simpan di context.
 */
export const createApiEnv = (runtimeEnv: ApiRuntimeEnv) =>
  createEnv({
    createFinalSchema: (shape) =>
      z.object(shape).superRefine((env, context) => {
        for (const [first, second] of OPTIONAL_PAIRS) {
          const isFirstSet = env[first] !== undefined;
          const isSecondSet = env[second] !== undefined;

          if (isFirstSet !== isSecondSet) {
            const missing = isFirstSet ? second : first;
            context.addIssue({
              code: "custom",
              message: `Wajib diisi bersama ${isFirstSet ? first : second}`,
              path: [missing],
            });
          }
        }
      }),
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError,
    runtimeEnv,
    server,
  });

export type ApiEnv = ReturnType<typeof createApiEnv>;
