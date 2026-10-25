import { z } from "zod";

import { fetchApi } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  TWO_FACTOR_METHOD,
} from "./schemas";
import type { SignInInput, SignUpInput, TwoFactorInput } from "./schemas";

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

const TWO_FACTOR_VERIFY_PATHS = {
  [TWO_FACTOR_METHOD.backupCode]: "/api/auth/two-factor/verify-backup-code",
  [TWO_FACTOR_METHOD.totp]: "/api/auth/two-factor/verify-totp",
} as const;

/**
 * Langkah kedua login. Api membaca cookie `two_factor` (diteruskan dari
 * request asli) untuk tahu pengguna mana yang sedang diverifikasi.
 */
export const verifyTwoFactor = ({
  api,
  request,
  input,
}: AuthRequestArgs & { input: TwoFactorInput }) =>
  postJson({
    api,
    body: { code: input.code, trustDevice: input.trustDevice },
    path: TWO_FACTOR_VERIFY_PATHS[input.method],
    request,
  });

const twoFactorRedirectSchema = z.object({
  twoFactorRedirect: z.literal(true),
});

/**
 * Login sukses tetapi pengguna mengaktifkan 2FA: better-auth membalas 200
 * dengan `twoFactorRedirect`, menghapus sesinya, dan memasang cookie
 * `two_factor` (≤10 menit). Dibaca dari salinan agar body asli tetap utuh.
 */
export const isTwoFactorRedirect = async (response: Response) =>
  twoFactorRedirectSchema.safeParse(
    await response
      .clone()
      .json()
      .catch(() => null)
  ).success;

// Nama cookie: `<prefix>.two_factor`, ditambah `__Secure-` di HTTPS.
const TWO_FACTOR_COOKIE_PATTERN =
  /(?:^|;\s*)(?:__Secure-)?[\w-]+\.two_factor=/u;

/**
 * Cek kasar bahwa tantangan 2FA sedang berjalan, hanya untuk UX (tanpa
 * cookie, form tak berguna). Keabsahan cookie tetap diverifikasi api.
 */
export const hasTwoFactorChallenge = (request: Request) =>
  TWO_FACTOR_COOKIE_PATTERN.test(request.headers.get("cookie") ?? "");

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

export interface TwoFactorError {
  message: string;
  /** Tantangan tidak bisa dilanjutkan; pengguna harus login ulang. */
  restart: boolean;
}

/** Pesan verifikasi 2FA gagal, dari status + `code` better-auth. */
export const getTwoFactorError = async (
  response: Response
): Promise<TwoFactorError> => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return { message: RATE_LIMITED_MESSAGE, restart: false };
  }

  const code = await readErrorCode(response);
  if (code === "INVALID_CODE" || code === "INVALID_BACKUP_CODE") {
    return { message: "Kode salah. Periksa lalu coba lagi.", restart: false };
  }
  if (code === "INVALID_TWO_FACTOR_COOKIE") {
    return {
      message: "Sesi verifikasi sudah berakhir. Silakan masuk lagi.",
      restart: true,
    };
  }
  if (code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE") {
    return {
      message: "Terlalu banyak kode salah. Silakan masuk lagi.",
      restart: true,
    };
  }
  if (code === "ACCOUNT_TEMPORARILY_LOCKED") {
    return {
      message:
        "Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi nanti.",
      restart: true,
    };
  }
  return {
    message: "Gagal memverifikasi kode. Silakan coba lagi.",
    restart: false,
  };
};

/** Pesan untuk `?error=` yang ditambahkan better-auth saat verifikasi gagal. */
export const getVerifyEmailErrorMessage = (code: string) => {
  if (code === "TOKEN_EXPIRED") {
    return "Tautan verifikasi sudah kedaluwarsa. Kirim ulang tautan baru di bawah.";
  }
  return "Tautan verifikasi tidak valid. Kirim ulang tautan baru di bawah.";
};
