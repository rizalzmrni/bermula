import type { StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

// `http(s)://host[:port]` saja: tanpa path, query, hash, atau trailing slash.
const ORIGIN_PATTERN = /^https?:\/\/[^/?#]+$/u;
const ORIGIN_MESSAGE =
  "Harus berupa origin (skema + host + port opsional), tanpa path atau garis miring di akhir";

/**
 * URL origin seperti `http://localhost:5173`. Path/trailing slash ditolak
 * karena CORS dan cookie membandingkan origin secara persis, dan agar
 * penggabungan `${APP_URL}/login` tidak menghasilkan `//`.
 */
export const originSchema = z.url().regex(ORIGIN_PATTERN, ORIGIN_MESSAGE);

/** Daftar origin dipisah koma, mis. `http://localhost:5173,http://localhost:5174`. */
export const originListSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
  .pipe(z.array(originSchema).min(1));

/** Pesan error menyebut nama variabel, agar mudah ditemukan di Workers Logs. */
export const onValidationError = (
  issues: readonly StandardSchemaV1.Issue[]
): never => {
  const details = issues
    .map((issue) => {
      const path = issue.path
        ?.map((segment) =>
          typeof segment === "object" ? String(segment.key) : String(segment)
        )
        .join(".");
      return `${path ?? "(root)"}: ${issue.message}`;
    })
    .join("; ");

  throw new Error(`Invalid environment variables: ${details}`);
};

/**
 * Integrasi opsional yang butuh dua variabel: keduanya kosong (fitur mati)
 * atau keduanya terisi. Dipasang lewat `createFinalSchema` + `superRefine`.
 */
export const requireOptionalPairs =
  <K extends string>(pairs: readonly (readonly [K, K])[]) =>
  (env: Partial<Record<K, unknown>>, context: z.RefinementCtx) => {
    for (const [first, second] of pairs) {
      const isFirstSet = env[first] !== undefined;
      const isSecondSet = env[second] !== undefined;

      if (isFirstSet !== isSecondSet) {
        context.addIssue({
          code: "custom",
          message: `Wajib diisi bersama ${isFirstSet ? first : second}`,
          path: [isFirstSet ? second : first],
        });
      }
    }
  };

/**
 * PostHog di browser (apps/app & apps/web). Project token (`phc_`) memang
 * publik; prefix dicek agar personal API key (`phx_`, rahasia) tidak tertukar.
 */
export const posthogClientSchema = {
  VITE_POSTHOG_HOST: originSchema.optional(),
  VITE_POSTHOG_PROJECT_TOKEN: z
    .string()
    .regex(/^phc_\S+$/u, "Harus project token PostHog (phc_...)")
    .optional(),
};

export const POSTHOG_CLIENT_PAIR = [
  "VITE_POSTHOG_PROJECT_TOKEN",
  "VITE_POSTHOG_HOST",
] as const;
