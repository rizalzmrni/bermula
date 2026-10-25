import { z } from "zod";

// Sama dengan default better-auth (`minPasswordLength`/`maxPasswordLength`);
// ubah keduanya bersamaan bila konfigurasi `packages/auth` diubah. Skema di
// file ini dipakai action (server) dan TanStack Form (klien), dan batasnya
// juga dipasang sebagai atribut browser, agar aturannya satu sumber.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 100;

export const emailSchema = z.email("Format email tidak valid.");

/** Kata sandi baru (daftar, reset, ganti kata sandi). */
export const newPasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter.`
  );

/** Kata sandi saat ini hanya dicek tidak kosong; kecocokannya dicek api. */
export const currentPasswordSchema = z
  .string()
  .min(1, "Kata sandi wajib diisi.");

export const signInSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(NAME_MAX_LENGTH, `Nama maksimal ${NAME_MAX_LENGTH} karakter.`),
  password: newPasswordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const resendVerificationSchema = z.object({ email: emailSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: newPasswordSchema,
  // Token 24 karakter dari better-auth; keabsahannya dicek api.
  token: z.string().min(1),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
export const totpCodeSchema = z
  .string()
  .regex(TOTP_CODE_PATTERN, `Masukkan ${TOTP_CODE_LENGTH} digit kode.`);

const backupCodeSchema = z
  .string()
  .trim()
  .min(1, "Kode cadangan wajib diisi.")
  .max(BACKUP_CODE_MAX_LENGTH, "Kode cadangan terlalu panjang.");

const twoFactorCodeSchemas = {
  [TWO_FACTOR_METHOD.backupCode]: z.object({ code: backupCodeSchema }),
  [TWO_FACTOR_METHOD.totp]: z.object({ code: totpCodeSchema }),
} as const;

/** Nilai form 2FA di klien (TanStack Form), per cara verifikasi. */
export const twoFactorFieldsSchemas = {
  [TWO_FACTOR_METHOD.backupCode]: twoFactorCodeSchemas[
    TWO_FACTOR_METHOD.backupCode
  ].extend({ trustDevice: z.boolean() }),
  [TWO_FACTOR_METHOD.totp]: twoFactorCodeSchemas[TWO_FACTOR_METHOD.totp].extend(
    { trustDevice: z.boolean() }
  ),
} as const;

/** Checkbox HTML hanya terkirim ("on") bila dicentang; hanya untuk `FormData`. */
export const checkboxSchema = z
  .literal("on")
  .optional()
  .transform((value) => value === "on");

/** Skema action 2FA: field klien + field tersembunyi & checkbox dari `FormData`. */
export const twoFactorSchema = z.discriminatedUnion("method", [
  twoFactorCodeSchemas[TWO_FACTOR_METHOD.totp].extend({
    method: z.literal(TWO_FACTOR_METHOD.totp),
    trustDevice: checkboxSchema,
  }),
  twoFactorCodeSchemas[TWO_FACTOR_METHOD.backupCode].extend({
    method: z.literal(TWO_FACTOR_METHOD.backupCode),
    trustDevice: checkboxSchema,
  }),
]);

export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export const parseTwoFactorMethod = (value: string | null): TwoFactorMethod =>
  value === TWO_FACTOR_METHOD.backupCode
    ? TWO_FACTOR_METHOD.backupCode
    : TWO_FACTOR_METHOD.totp;
