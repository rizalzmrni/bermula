import { createEnv } from "@t3-oss/env-core";

import { onValidationError, originListSchema, originSchema } from "./shared";

const server = {
  APP_URL: originSchema,
  CORS_ORIGINS: originListSchema,
  WEB_URL: originSchema,
};

export type ApiRuntimeEnv = Partial<Record<keyof typeof server, string>>;

/**
 * Di Workers, env baru tersedia saat request (`c.env`), bukan saat modul
 * dimuat. Panggil sekali per request di middleware, lalu simpan di context.
 */
export const createApiEnv = (runtimeEnv: ApiRuntimeEnv) =>
  createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError,
    runtimeEnv,
    server,
  });

export type ApiEnv = ReturnType<typeof createApiEnv>;
