import type { CaptureException } from "@bermula/observability/posthog";
import { z } from "@hono/zod-openapi";
import type { Hook } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "../types";

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "UNAUTHORIZED" }),
      details: z.unknown().optional(),
      message: z
        .string()
        .openapi({ example: "Silakan masuk terlebih dahulu." }),
    }),
  })
  .openapi("Error", {
    description: "Bentuk error seragam untuk semua endpoint.",
  });

export type ErrorBody = z.infer<typeof ErrorSchema>;

/** Respons error untuk `createRoute`, agar setiap error ikut terdokumentasi. */
export const errorResponse = (description: string) => ({
  content: { "application/json": { schema: ErrorSchema } },
  description,
});

/** Error yang sengaja dilempar service/middleware; pesannya aman ditampilkan ke pengguna. */
export class ApiError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;
  readonly details: unknown;

  constructor({
    status,
    code,
    message,
    details,
  }: {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const toBody = ({
  code,
  details,
  message,
}: {
  code: string;
  message: string;
  details?: unknown;
}): ErrorBody => ({
  error: details === undefined ? { code, message } : { code, details, message },
});

/** `defaultHook` OpenAPIHono: error validasi Zod → 400 dengan bentuk seragam. */
export const validationHook: Hook<unknown, AppEnv, string, unknown> = (
  result,
  c
) => {
  if (result.success) {
    return;
  }
  return c.json(
    toBody({
      code: "VALIDATION_ERROR",
      details: result.error.issues.map(({ message, path }) => ({
        message,
        path: path.join("."),
      })),
      message: "Input tidak valid.",
    }),
    400
  );
};

export const notFoundHandler = (c: Context<AppEnv>) =>
  c.json(
    toBody({ code: "NOT_FOUND", message: "Endpoint tidak ditemukan." }),
    404
  );

const reportException = async ({
  c,
  captureException,
  error,
}: {
  c: Context<AppEnv>;
  captureException: CaptureException;
  error: Error;
}) => {
  try {
    await captureException(error, {
      handled: false,
      properties: { method: c.req.method, path: c.req.path },
    });
  } catch (captureError) {
    c.var.logger.warn("Failed to send exception to PostHog", {
      error: captureError,
    });
  }
};

/**
 * `app.onError` global. Error yang dikenal diteruskan apa adanya; error tak
 * terduga dicatat, dikirim ke PostHog, dan dibalas 500 tanpa membocorkan detail.
 */
export const errorHandler = (error: Error, c: Context<AppEnv>) => {
  if (error instanceof ApiError) {
    return c.json(toBody(error), error.status);
  }

  if (error instanceof HTTPException) {
    return c.json(
      toBody({ code: "HTTP_ERROR", message: error.message }),
      error.status
    );
  }

  // Variabel context bisa belum ada bila error terjadi di contextMiddleware
  // (mis. env tidak valid); log tetap tertulis lewat Workers Logs.
  const { captureException, logger } = c.var as Partial<AppEnv["Variables"]>;
  logger?.error("Unhandled error", {
    error,
    method: c.req.method,
    path: c.req.path,
  });

  if (captureException) {
    c.executionCtx.waitUntil(reportException({ c, captureException, error }));
  }

  return c.json(
    toBody({
      code: "INTERNAL_ERROR",
      message: "Terjadi kesalahan pada server.",
    }),
    500
  );
};
