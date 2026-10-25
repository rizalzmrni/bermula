import { z } from "zod";

import { fetchApi } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInInput = z.infer<typeof signInSchema>;

interface AuthRequestArgs {
  api: ApiBinding;
  request: Request;
}

const JSON_HEADERS = { "content-type": "application/json" };

export const signInWithEmail = ({
  api,
  request,
  input,
}: AuthRequestArgs & { input: SignInInput }) =>
  fetchApi({
    api,
    init: {
      body: JSON.stringify(input),
      headers: JSON_HEADERS,
      method: "POST",
    },
    path: "/api/auth/sign-in/email",
    request,
  });

export const signOut = ({ api, request }: AuthRequestArgs) =>
  fetchApi({
    api,
    // better-auth menolak body kosong pada POST JSON.
    init: { body: "{}", headers: JSON_HEADERS, method: "POST" },
    path: "/api/auth/sign-out",
    request,
  });

const errorBodySchema = z.object({ code: z.string().optional() });

const HTTP_TOO_MANY_REQUESTS = 429;

/** Pesan login gagal untuk pengguna, dari status + `code` better-auth. */
export const getSignInErrorMessage = async (response: Response) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return "Terlalu banyak percobaan. Coba lagi dalam satu menit.";
  }

  const body = errorBodySchema.safeParse(
    await response.json().catch(() => null)
  );
  const code = body.success ? body.data.code : undefined;

  if (code === "EMAIL_NOT_VERIFIED") {
    return "Email belum diverifikasi. Buka tautan verifikasi di kotak masuk Anda.";
  }
  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return "Email atau kata sandi salah.";
  }
  return "Gagal masuk. Silakan coba lagi.";
};
