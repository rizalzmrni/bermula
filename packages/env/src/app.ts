import { createEnv } from "@t3-oss/env-core";

import { onValidationError, originSchema } from "./shared";

const client = {
  VITE_API_URL: originSchema,
};

export type AppClientRuntimeEnv = Partial<Record<keyof typeof client, string>>;

export const createAppClientEnv = (runtimeEnv: AppClientRuntimeEnv) =>
  createEnv({
    client,
    clientPrefix: "VITE_",
    emptyStringAsUndefined: true,
    onValidationError,
    runtimeEnv,
  });

export type AppClientEnv = ReturnType<typeof createAppClientEnv>;

/** Env klien `apps/app`; Vite mengganti `import.meta.env` saat build. */
export const getAppClientEnv = () => createAppClientEnv(import.meta.env);
