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
  VITE_API_URL: originSchema,
  /** Origin apps/web, untuk tautan halaman legal (kebijakan privasi, syarat). */
  VITE_WEB_URL: originSchema,
  ...posthogClientSchema,
};

export type AppClientRuntimeEnv = Partial<Record<keyof typeof client, string>>;

export const createAppClientEnv = (runtimeEnv: AppClientRuntimeEnv) =>
  createEnv({
    client,
    clientPrefix: "VITE_",
    createFinalSchema: (shape) =>
      z.object(shape).superRefine(requireOptionalPairs([POSTHOG_CLIENT_PAIR])),
    emptyStringAsUndefined: true,
    onValidationError,
    runtimeEnv,
  });

export type AppClientEnv = ReturnType<typeof createAppClientEnv>;

/** Env klien `apps/app`; Vite mengganti `import.meta.env` saat build. */
export const getAppClientEnv = () => createAppClientEnv(import.meta.env);
