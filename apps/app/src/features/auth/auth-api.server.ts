import { z } from "zod";

import { fetchApi } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./schemas";
import type { SignInInput, SignUpInput } from "./schemas";

/** Route app yang dituju tautan verifikasi email (lihat `routes/verify-email.tsx`). */
export const VERIFY_EMAIL_PATH = "/verify-email";

interface AuthRequestArgs {
  api: ApiBinding;
  request: Request;
}

const JSON_HEADERS = { "content-type": "application/json" };

const postJson = ({
  api,
  request,
  path,
  body,
}: AuthRequestArgs & { path: `/${string}`; body: unknown }) =>
  fetchApi({
    api,
    init: { body: JSON.stringify(body), headers: JSON_HEADERS, method: "POST" },
    path,
    request,
  });

/**
 * URL absolut halaman verifikasi di app ini. Harus absolut: tautan email
 * dibuka di host api, dan URL relatif akan diarahkan ke host api. Origin
 * diambil dari request (bukan hardcode) dan dicek `trustedOrigins` better-auth.
 */
export const getVerifyEmailCallbackUrl = (request: Request) =>
  `${new URL(request.url).origin}${VERIFY_EMAIL_PATH}`;

export const signInWithEmail = ({
  api,
  request,
  input,
}: AuthRequestArgs & { input: SignInInput }) =>
  postJson({ api, body: input, path: "/api/auth/sign-in/email", request });

export const signUpWithEmail = ({
  api,
  request,
  input,
}: AuthRequestArgs & { input: SignUpInput }) =>
  postJson({
    api,
    body: { ...input, callbackURL: getVerifyEmailCallbackUrl(request) },
    path: "/api/auth/sign-up/email",
    request,
  });

export const resendVerificationEmail = ({
  api,
  request,
  email,
}: AuthRequestArgs & { email: string }) =>
  postJson({
    api,
    body: { callbackURL: getVerifyEmailCallbackUrl(request), email },
    path: "/api/auth/send-verification-email",
    request,
  });

export const signOut = ({ api, request }: AuthRequestArgs) =>
  // better-auth menolak body kosong pada POST JSON.
  postJson({ api, body: {}, path: "/api/auth/sign-out", request });

const errorBodySchema = z.object({ code: z.string().optional() });

const HTTP_TOO_MANY_REQUESTS = 429;

const RATE_LIMITED_MESSAGE =
  "Terlalu banyak percobaan. Coba lagi dalam satu menit.";

/** `code` error better-auth dari body respons, bila ada. */
const readErrorCode = async (response: Response) => {
  const body = errorBodySchema.safeParse(
    await response.json().catch(() => null)
  );
  return body.success ? body.data.code : undefined;
};

/** Pesan login gagal untuk pengguna, dari status + `code` better-auth. */
export const getSignInErrorMessage = async (response: Response) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return RATE_LIMITED_MESSAGE;
  }

  const code = await readErrorCode(response);
  if (code === "EMAIL_NOT_VERIFIED") {
    return "Email belum diverifikasi. Buka tautan verifikasi di kotak masuk Anda.";
  }
  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return "Email atau kata sandi salah.";
  }
  return "Gagal masuk. Silakan coba lagi.";
};

/**
 * Pesan pendaftaran gagal. Email yang sudah terdaftar tidak menghasilkan
 * error: better-auth membalas sukses generik (anti-enumerasi akun) karena
 * verifikasi email wajib.
 */
export const getSignUpErrorMessage = async (response: Response) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return RATE_LIMITED_MESSAGE;
  }

  const code = await readErrorCode(response);
  if (code === "PASSWORD_TOO_SHORT") {
    return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }
  if (code === "PASSWORD_TOO_LONG") {
    return `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter.`;
  }
  if (code === "INVALID_EMAIL") {
    return "Format email tidak valid.";
  }
  return "Gagal mendaftar. Silakan coba lagi.";
};

/** Pesan untuk `?error=` yang ditambahkan better-auth saat verifikasi gagal. */
export const getVerifyEmailErrorMessage = (code: string) => {
  if (code === "TOKEN_EXPIRED") {
    return "Tautan verifikasi sudah kedaluwarsa. Kirim ulang tautan baru di bawah.";
  }
  return "Tautan verifikasi tidak valid. Kirim ulang tautan baru di bawah.";
};
