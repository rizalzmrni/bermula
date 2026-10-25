import { createEnv } from "@t3-oss/env-core";

import { onValidationError, originSchema } from "./shared";

const client = {
  VITE_APP_URL: originSchema,
};

export type WebClientRuntimeEnv = Partial<Record<keyof typeof client, string>>;

export const createWebClientEnv = (runtimeEnv: WebClientRuntimeEnv) =>
  createEnv({
    client,
    clientPrefix: "VITE_",
    emptyStringAsUndefined: true,
    onValidationError,
    runtimeEnv,
  });

export type WebClientEnv = ReturnType<typeof createWebClientEnv>;

/** Env klien `apps/web`; Vite mengganti `import.meta.env` saat build. */
export const getWebClientEnv = () => createWebClientEnv(import.meta.env);
