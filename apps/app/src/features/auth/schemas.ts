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
