import { z } from "zod";

import { postApiJson } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import {
  HTTP_TOO_MANY_REQUESTS,
  RATE_LIMITED_MESSAGE,
  readErrorCode,
} from "../../lib/api-error";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../auth/schemas";
import type { TwoFactorEnrollment } from "./action-result";
import type { ChangePasswordInput } from "./schemas";

interface SecurityRequestArgs {
  api: ApiBinding;
  request: Request;
}

/**
 * Langkah 1 aktivasi 2FA. better-auth menyimpan rahasia TOTP tetapi 2FA baru
 * aktif setelah kode pertama diverifikasi (`verifyTwoFactorEnrollment`).
 */
export const enableTwoFactor = ({
  api,
  request,
  password,
}: SecurityRequestArgs & { password: string }) =>
  postApiJson({
    api,
    body: { password },
    path: "/api/auth/two-factor/enable",
    request,
  });

/** Langkah 2 aktivasi: kode pertama dari aplikasi; api mengganti sesi. */
export const verifyTwoFactorEnrollment = ({
  api,
  request,
  code,
}: SecurityRequestArgs & { code: string }) =>
  postApiJson({
    api,
    body: { code },
    path: "/api/auth/two-factor/verify-totp",
    request,
  });

export const disableTwoFactor = ({
  api,
  request,
  password,
}: SecurityRequestArgs & { password: string }) =>
  postApiJson({
    api,
    body: { password },
    path: "/api/auth/two-factor/disable",
    request,
  });

/** Membuat kode cadangan baru; kode lama langsung tidak berlaku. */
export const regenerateBackupCodes = ({
  api,
  request,
  password,
}: SecurityRequestArgs & { password: string }) =>
  postApiJson({
    api,
    body: { password },
    path: "/api/auth/two-factor/generate-backup-codes",
    request,
  });

export const changePassword = ({
  api,
  request,
  input,
}: SecurityRequestArgs & { input: ChangePasswordInput }) =>
  postApiJson({
    api,
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: input.revokeOtherSessions,
    },
    path: "/api/auth/change-password",
    request,
  });

const backupCodesSchema = z.array(z.string().min(1)).min(1);

const enrollmentSchema = z.object({
  backupCodes: backupCodesSchema,
  totpURI: z.string().startsWith("otpauth://totp/"),
});

/** Body respons `enable`, divalidasi karena isinya ditampilkan ke pengguna. */
export const readEnrollment = async (
  response: Response
): Promise<TwoFactorEnrollment | null> => {
  const parsed = enrollmentSchema.safeParse(
    await response.json().catch(() => null)
  );
  if (!parsed.success) {
    return null;
  }
  const secret = new URL(parsed.data.totpURI).searchParams.get("secret");
  return secret ? { ...parsed.data, secret } : null;
};

export const readBackupCodes = async (response: Response) => {
  const parsed = z
    .object({ backupCodes: backupCodesSchema })
    .safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.backupCodes : null;
};

/** Pesan perubahan keamanan gagal, dari status + `code` better-auth. */
export const getSecurityErrorMessage = async (response: Response) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return RATE_LIMITED_MESSAGE;
  }

  const code = await readErrorCode(response);
  if (code === "INVALID_PASSWORD") {
    return "Kata sandi salah.";
  }
  if (code === "INVALID_CODE") {
    return "Kode salah. Pastikan jam ponsel Anda tepat lalu coba lagi.";
  }
  if (code === "PASSWORD_TOO_SHORT") {
    return `Kata sandi baru minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }
  if (code === "PASSWORD_TOO_LONG") {
    return `Kata sandi baru maksimal ${PASSWORD_MAX_LENGTH} karakter.`;
  }
  if (code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return "Akun ini masuk lewat Google dan belum punya kata sandi.";
  }
  return "Gagal menyimpan perubahan. Silakan coba lagi.";
};
