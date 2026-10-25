import { z } from "zod";

import {
  checkboxSchema,
  currentPasswordSchema,
  newPasswordSchema,
  totpCodeSchema,
} from "../auth/schemas";

/** Aksi di halaman keamanan; dikirim sebagai field `intent` tiap form. */
export const SECURITY_INTENT = {
  changePassword: "change-password",
  disableTwoFactor: "disable-two-factor",
  enableTwoFactor: "enable-two-factor",
  regenerateBackupCodes: "regenerate-backup-codes",
  verifyTwoFactor: "verify-two-factor",
} as const;

export type SecurityIntent =
  (typeof SECURITY_INTENT)[keyof typeof SECURITY_INTENT];

/** Form yang hanya meminta kata sandi saat ini (aktifkan/matikan 2FA, kode cadangan). */
export const currentPasswordFieldsSchema = z.object({
  password: currentPasswordSchema,
});

/** Kode pertama dari aplikasi authenticator saat aktivasi 2FA. */
export const verifyTwoFactorFieldsSchema = z.object({ code: totpCodeSchema });

const passwordFieldsSchema = z.object({
  confirmPassword: z.string(),
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema,
});

const confirmPasswordMatches = (input: {
  confirmPassword: string;
  newPassword: string;
}) => input.confirmPassword === input.newPassword;

const CONFIRM_PASSWORD_ISSUE = {
  message: "Konfirmasi kata sandi tidak sama.",
  path: ["confirmPassword"],
};

/** Field ganti kata sandi yang diisi pengguna (TanStack Form di klien). */
export const changePasswordFieldsSchema = passwordFieldsSchema
  .extend({ revokeOtherSessions: z.boolean() })
  .refine(confirmPasswordMatches, CONFIRM_PASSWORD_ISSUE);

const changePasswordSchema = passwordFieldsSchema
  .extend({
    intent: z.literal(SECURITY_INTENT.changePassword),
    revokeOtherSessions: checkboxSchema,
  })
  .refine(confirmPasswordMatches, CONFIRM_PASSWORD_ISSUE);

/** Skema action: field klien + `intent` & checkbox dari `FormData`. */
export const securityActionSchema = z.discriminatedUnion("intent", [
  currentPasswordFieldsSchema.extend({
    intent: z.literal(SECURITY_INTENT.enableTwoFactor),
  }),
  verifyTwoFactorFieldsSchema.extend({
    intent: z.literal(SECURITY_INTENT.verifyTwoFactor),
  }),
  currentPasswordFieldsSchema.extend({
    intent: z.literal(SECURITY_INTENT.disableTwoFactor),
  }),
  currentPasswordFieldsSchema.extend({
    intent: z.literal(SECURITY_INTENT.regenerateBackupCodes),
  }),
  changePasswordSchema,
]);

export type SecurityActionInput = z.infer<typeof securityActionSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
