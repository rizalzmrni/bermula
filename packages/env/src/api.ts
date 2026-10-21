import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { onValidationError, originListSchema, originSchema } from "./shared";

// Neon memberi URL `postgresql://`; `postgres://` juga diterima driver.
const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\//u;

// Sama dengan `LogLevel` di @bermula/observability; kecocokannya dicek saat
// apps/api meneruskan `env.LOG_LEVEL` ke `createLogger`.
const LOG_LEVEL_VALUES = ["debug", "info", "warn", "error"] as const;

const server = {
  APP_URL: originSchema,
  BETTER_STACK_INGESTING_URL: z.url().optional(),
  BETTER_STACK_SOURCE_TOKEN: z.string().min(1).optional(),
  CORS_ORIGINS: originListSchema,
  DATABASE_URL: z.url().regex(POSTGRES_URL_PATTERN, "Harus URL postgresql://"),
  LOG_LEVEL: z.enum(LOG_LEVEL_VALUES).default("info"),
  POSTHOG_HOST: originSchema.optional(),
  POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
  WEB_URL: originSchema,
};

// Integrasi opsional: dev lokal cukup memakai console, tetapi bila salah satu
// variabel pasangan diisi, pasangannya wajib ada agar tidak gagal diam-diam.
const OPTIONAL_PAIRS = [
  ["BETTER_STACK_SOURCE_TOKEN", "BETTER_STACK_INGESTING_URL"],
  ["POSTHOG_PROJECT_TOKEN", "POSTHOG_HOST"],
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
