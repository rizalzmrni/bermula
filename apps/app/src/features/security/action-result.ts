import type { SECURITY_INTENT, SecurityIntent } from "./schemas";

/** Data aktivasi yang hanya ditampilkan sekali: QR, kunci manual, kode cadangan. */
export interface TwoFactorEnrollment {
  totpURI: string;
  secret: string;
  backupCodes: string[];
}

/**
 * Hasil action `routes/settings-security.tsx`, dibaca komponen lewat
 * `useFetcher`. Rahasia hanya ada di respons ini (tidak di URL/cookie/log).
 */
export type SecurityActionResult =
  | {
      intent: typeof SECURITY_INTENT.enableTwoFactor;
      enrollment: TwoFactorEnrollment;
    }
  | {
      intent: typeof SECURITY_INTENT.regenerateBackupCodes;
      backupCodes: string[];
    }
  | {
      intent:
        | typeof SECURITY_INTENT.verifyTwoFactor
        | typeof SECURITY_INTENT.disableTwoFactor
        | typeof SECURITY_INTENT.changePassword;
      success: true;
    }
  | { intent: SecurityIntent | null; formError: string };

export const isFormError = (
  result: SecurityActionResult | undefined
): result is Extract<SecurityActionResult, { formError: string }> =>
  result !== undefined && "formError" in result;
