import { z } from "zod";

// Sama dengan default better-auth (`minPasswordLength`/`maxPasswordLength`);
// ubah keduanya bersamaan bila konfigurasi `packages/auth` diubah. Dipakai
// action (Zod) dan form (atribut browser) agar aturannya satu sumber.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 100;

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const resendVerificationSchema = z.object({ email: z.email() });

/** Cara verifikasi langkah kedua; nilai juga dipakai di query `?method=`. */
export const TWO_FACTOR_METHOD = {
  backupCode: "backup-code",
  totp: "totp",
} as const;

export type TwoFactorMethod =
  (typeof TWO_FACTOR_METHOD)[keyof typeof TWO_FACTOR_METHOD];

export const TOTP_CODE_LENGTH = 6;
// Kode cadangan better-auth berbentuk `xxxxx-xxxxx`; batas atas hanya
// mencegah input berlebihan, kecocokan dicek api.
export const BACKUP_CODE_MAX_LENGTH = 32;

const TOTP_CODE_PATTERN = /^\d{6}$/u;

/** Kode 6 digit dari aplikasi authenticator (login & aktivasi 2FA). */
export const totpCodeSchema = z.string().regex(TOTP_CODE_PATTERN);

/** Checkbox HTML hanya terkirim ("on") bila dicentang. */
export const checkboxSchema = z
  .literal("on")
  .optional()
  .transform((value) => value === "on");

export const twoFactorSchema = z.discriminatedUnion("method", [
  z.object({
    code: totpCodeSchema,
    method: z.literal(TWO_FACTOR_METHOD.totp),
    trustDevice: checkboxSchema,
  }),
  z.object({
    code: z.string().trim().min(1).max(BACKUP_CODE_MAX_LENGTH),
    method: z.literal(TWO_FACTOR_METHOD.backupCode),
    trustDevice: checkboxSchema,
  }),
]);

export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export const parseTwoFactorMethod = (value: string | null): TwoFactorMethod =>
  value === TWO_FACTOR_METHOD.backupCode
    ? TWO_FACTOR_METHOD.backupCode
    : TWO_FACTOR_METHOD.totp;
