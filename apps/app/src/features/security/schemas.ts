import { z } from "zod";

import {
  checkboxSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
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

// Kata sandi saat ini hanya dicek tidak kosong; kecocokannya dicek api.
const currentPasswordSchema = z.string().min(1);

const changePasswordSchema = z
  .object({
    confirmPassword: z.string(),
    currentPassword: currentPasswordSchema,
    intent: z.literal(SECURITY_INTENT.changePassword),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    revokeOtherSessions: checkboxSchema,
  })
  .refine((input) => input.confirmPassword === input.newPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });

export const securityActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal(SECURITY_INTENT.enableTwoFactor),
    password: currentPasswordSchema,
  }),
  z.object({
    code: totpCodeSchema,
    intent: z.literal(SECURITY_INTENT.verifyTwoFactor),
  }),
  z.object({
    intent: z.literal(SECURITY_INTENT.disableTwoFactor),
    password: currentPasswordSchema,
  }),
  z.object({
    intent: z.literal(SECURITY_INTENT.regenerateBackupCodes),
    password: currentPasswordSchema,
  }),
  changePasswordSchema,
]);

export type SecurityActionInput = z.infer<typeof securityActionSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
