import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { onValidationError, originSchema } from "./shared";

const client = {
  /** Default `false`: staging/preview tidak boleh terindeks; produksi wajib `true`. */
  VITE_ALLOW_INDEXING: z.stringbool().default(false),
  VITE_APP_URL: originSchema,
  /** Origin situs ini sendiri, untuk canonical, Open Graph, dan sitemap. */
  VITE_WEB_URL: originSchema,
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
