import { APP_NAME } from "@bermula/core/brand";
import { data, Link, redirect } from "react-router";

import {
  getVerifyEmailErrorMessage,
  resendVerificationEmail,
} from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { ResendVerificationForm } from "../features/auth/resend-verification-form";
import type { ResendVerificationResult } from "../features/auth/resend-verification-form";
import { resendVerificationSchema } from "../features/auth/schemas";
import { getCloudflare } from "../lib/cloudflare";
import type { Route } from "./+types/verify-email";

const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;

export const meta = () => [{ title: `Verifikasi email — ${APP_NAME}` }];

/**
 * Tujuan tautan verifikasi (`callbackURL`). Bila berhasil, api sudah
 * memasang cookie sesi (`autoSignInAfterVerification`), jadi langsung ke
 * beranda; bila gagal, better-auth menambahkan `?error=<CODE>`.
 */
export const loader = ({ request }: Route.LoaderArgs) => {
  const error = new URL(request.url).searchParams.get("error");
  if (!error) {
    throw redirect("/");
  }
  return { errorMessage: getVerifyEmailErrorMessage(error) };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return data<ResendVerificationResult>(
      { formError: "Format email tidak valid." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await resendVerificationEmail({
    api: getCloudflare(context).env.API,
    email: parsed.data.email,
    request,
  });
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return data<ResendVerificationResult>(
      { formError: "Terlalu banyak percobaan. Coba lagi dalam satu menit." },
      { status: response.status }
    );
  }
  if (!response.ok) {
    return data<ResendVerificationResult>(
      { formError: "Gagal mengirim tautan. Silakan coba lagi." },
      { status: response.status }
    );
  }
  return data<ResendVerificationResult>({ sent: true });
};

const VerifyEmailPage = ({ loaderData }: Route.ComponentProps) => (
  <AuthLayout
    description={loaderData.errorMessage}
    footer={
      <p>
        Sudah terverifikasi?{" "}
        <Link className={AUTH_LINK_CLASS} to="/sign-in">
          Masuk
        </Link>
      </p>
    }
    title="Verifikasi gagal"
  >
    <ResendVerificationForm />
  </AuthLayout>
);

export default VerifyEmailPage;
