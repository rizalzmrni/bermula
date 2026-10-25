import { APP_NAME } from "@bermula/core/brand";
import { data, useRouteLoaderData } from "react-router";
import type { z } from "zod";

import type { SecurityActionResult } from "../features/security/action-result";
import { ChangePasswordSection } from "../features/security/change-password-section";
import {
  SECURITY_INTENT,
  securityActionSchema,
} from "../features/security/schemas";
import type { SecurityIntent } from "../features/security/schemas";
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  getSecurityErrorMessage,
  readBackupCodes,
  readEnrollment,
  regenerateBackupCodes,
  verifyTwoFactorEnrollment,
} from "../features/security/security-api.server";
import { TwoFactorSection } from "../features/security/two-factor-section";
import { getSetCookieHeaders } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/settings-security";
import type { loader as appLayoutLoader } from "./app-layout";

const HTTP_BAD_REQUEST = 400;
const HTTP_BAD_GATEWAY = 502;

export const meta = () => [{ title: `Keamanan — ${APP_NAME}` }];

// Respons action bisa memuat rahasia TOTP atau kode cadangan. React Router
// hanya meneruskan `Set-Cookie` dari `data()` secara otomatis, jadi header
// lain harus lewat export ini.
export const headers = () => ({ "Cache-Control": "no-store" });

/** Pesan validasi: konfirmasi kata sandi dijelaskan, sisanya pesan umum. */
const getValidationMessage = (error: z.ZodError) =>
  error.issues.find((issue) => issue.path.includes("confirmPassword"))
    ?.message ?? "Periksa kembali isian Anda.";

/**
 * Respons action. Cookie dari api diteruskan karena aktivasi/penonaktifan 2FA
 * dan ganti kata sandi mengganti sesi.
 */
const respond = (
  result: SecurityActionResult,
  {
    status = 200,
    apiResponse,
  }: { status?: number; apiResponse?: Response } = {}
) =>
  data(result, {
    headers: apiResponse ? getSetCookieHeaders(apiResponse) : undefined,
    status,
  });

const respondWithApiError = async (
  intent: SecurityIntent,
  apiResponse: Response
) =>
  respond(
    { formError: await getSecurityErrorMessage(apiResponse), intent },
    { status: apiResponse.status }
  );

const UNEXPECTED_RESPONSE = "Respons server tidak terduga. Silakan coba lagi.";

export const action = async ({ request, context }: Route.ActionArgs) => {
  // Fetcher POST tidak melewati loader layout; sesi dicek ulang di sini.
  await requireSession({ context, request });

  const parsed = securityActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return respond(
      { formError: getValidationMessage(parsed.error), intent: null },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const input = parsed.data;
  const args = { api: getCloudflare(context).env.API, request };

  switch (input.intent) {
    case SECURITY_INTENT.enableTwoFactor: {
      const response = await enableTwoFactor({
        ...args,
        password: input.password,
      });
      if (!response.ok) {
        return respondWithApiError(input.intent, response);
      }
      const enrollment = await readEnrollment(response);
      return enrollment
        ? respond(
            { enrollment, intent: input.intent },
            { apiResponse: response }
          )
        : respond(
            { formError: UNEXPECTED_RESPONSE, intent: input.intent },
            { status: HTTP_BAD_GATEWAY }
          );
    }
    case SECURITY_INTENT.verifyTwoFactor: {
      const response = await verifyTwoFactorEnrollment({
        ...args,
        code: input.code,
      });
      return response.ok
        ? respond(
            { intent: input.intent, success: true },
            { apiResponse: response }
          )
        : respondWithApiError(input.intent, response);
    }
    case SECURITY_INTENT.regenerateBackupCodes: {
      const response = await regenerateBackupCodes({
        ...args,
        password: input.password,
      });
      if (!response.ok) {
        return respondWithApiError(input.intent, response);
      }
      const backupCodes = await readBackupCodes(response);
      return backupCodes
        ? respond(
            { backupCodes, intent: input.intent },
            { apiResponse: response }
          )
        : respond(
            { formError: UNEXPECTED_RESPONSE, intent: input.intent },
            { status: HTTP_BAD_GATEWAY }
          );
    }
    case SECURITY_INTENT.disableTwoFactor: {
      const response = await disableTwoFactor({
        ...args,
        password: input.password,
      });
      return response.ok
        ? respond(
            { intent: input.intent, success: true },
            { apiResponse: response }
          )
        : respondWithApiError(input.intent, response);
    }
    case SECURITY_INTENT.changePassword: {
      const response = await changePassword({ ...args, input });
      return response.ok
        ? respond(
            { intent: input.intent, success: true },
            { apiResponse: response }
          )
        : respondWithApiError(input.intent, response);
    }
    default: {
      throw new Error("Unhandled security intent");
    }
  }
};

const SecuritySettingsPage = () => {
  const layoutData =
    useRouteLoaderData<typeof appLayoutLoader>("routes/app-layout");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Keamanan</h1>
        <p className="text-muted-foreground text-sm">
          Kelola kata sandi dan verifikasi dua langkah akun Anda.
        </p>
      </div>
      <TwoFactorSection
        enabled={layoutData?.account.user.twoFactorEnabled ?? false}
      />
      <ChangePasswordSection />
    </div>
  );
};

export default SecuritySettingsPage;
