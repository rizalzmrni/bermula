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
