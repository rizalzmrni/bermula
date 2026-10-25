import { APP_NAME } from "@bermula/core/brand";
import { data, Link, redirect } from "react-router";

import {
  getSignInErrorMessage,
  signInWithEmail,
} from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { LoginForm } from "../features/auth/login-form";
import { signInSchema } from "../features/auth/schemas";
import { getSetCookieHeaders } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import { getSafeRedirect } from "../lib/redirect";
import { getAccount } from "../lib/session.server";
import type { Route } from "./+types/sign-in";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Masuk — ${APP_NAME}` }];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const redirectTo = new URL(request.url).searchParams.get("redirectTo");
  // Sudah login: langsung ke tujuan, jangan tampilkan form lagi.
  if (await getAccount({ context, request })) {
    throw redirect(getSafeRedirect(redirectTo));
  }
  return { redirectTo };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return data(
      { formError: "Periksa kembali email dan kata sandi Anda." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await signInWithEmail({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (!response.ok) {
    return data(
      { formError: await getSignInErrorMessage(response) },
      { status: response.status }
    );
  }

  // Cookie sesi dari api diteruskan ke browser lewat respons redirect ini.
  throw redirect(getSafeRedirect(formData.get("redirectTo")), {
    headers: getSetCookieHeaders(response),
  });
};

const LoginPage = ({ loaderData, actionData }: Route.ComponentProps) => (
  <AuthLayout
    description="Gunakan email dan kata sandi terdaftar."
    footer={
      <p>
        Belum punya akun?{" "}
        <Link className={AUTH_LINK_CLASS} to="/sign-up">
          Daftar
        </Link>
      </p>
    }
    title="Masuk ke akun Anda"
  >
    <LoginForm
      formError={actionData?.formError}
      redirectTo={loaderData.redirectTo}
    />
  </AuthLayout>
);

export default LoginPage;
