import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import {
  onValidationError,
  originSchema,
  POSTHOG_CLIENT_PAIR,
  posthogClientSchema,
  requireOptionalPairs,
} from "./shared";

const client = {
  /** Default `false`: staging/preview tidak boleh terindeks; produksi wajib `true`. */
  VITE_ALLOW_INDEXING: z.stringbool().default(false),
  VITE_APP_URL: originSchema,
  /** ID aliran data GA4; kosong = Google Analytics mati. */
  VITE_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/u, "Harus Measurement ID GA4 (G-...)")
    .optional(),
  /** Origin situs ini sendiri, untuk canonical, Open Graph, dan sitemap. */
  VITE_WEB_URL: originSchema,
  ...posthogClientSchema,
};

export type WebClientRuntimeEnv = Partial<Record<keyof typeof client, string>>;

export const createWebClientEnv = (runtimeEnv: WebClientRuntimeEnv) =>
  createEnv({
    client,
    clientPrefix: "VITE_",
    createFinalSchema: (shape) =>
      z.object(shape).superRefine(requireOptionalPairs([POSTHOG_CLIENT_PAIR])),
    emptyStringAsUndefined: true,
    onValidationError,
    runtimeEnv,
  });

export type WebClientEnv = ReturnType<typeof createWebClientEnv>;

/** Env klien `apps/web`; Vite mengganti `import.meta.env` saat build. */
export const getWebClientEnv = () => createWebClientEnv(import.meta.env);
