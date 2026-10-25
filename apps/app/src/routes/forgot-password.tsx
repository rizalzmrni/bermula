import { APP_NAME } from "@bermula/core/brand";
import { data, Link, redirect } from "react-router";

import { requestPasswordReset } from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { ForgotPasswordForm } from "../features/auth/forgot-password-form";
import { forgotPasswordSchema } from "../features/auth/schemas";
import { HTTP_TOO_MANY_REQUESTS, RATE_LIMITED_MESSAGE } from "../lib/api-error";
import { getCloudflare } from "../lib/cloudflare";
import { getAccount } from "../lib/session.server";
import type { Route } from "./+types/forgot-password";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Lupa kata sandi — ${APP_NAME}` }];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  if (await getAccount({ context, request })) {
    throw redirect("/");
  }
  return null;
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return data(
      { formError: "Format email tidak valid." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await requestPasswordReset({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return data(
      { formError: RATE_LIMITED_MESSAGE },
      { status: response.status }
    );
  }
  if (!response.ok) {
    return data(
      { formError: "Gagal mengirim tautan. Silakan coba lagi." },
      { status: response.status }
    );
  }
  return { sentTo: parsed.data.email };
};

const SIGN_IN_FOOTER = (
  <p>
    Ingat kata sandi Anda?{" "}
    <Link className={AUTH_LINK_CLASS} to="/sign-in">
      Masuk
    </Link>
  </p>
);

const ForgotPasswordPage = ({ actionData }: Route.ComponentProps) => {
  if (actionData && "sentTo" in actionData) {
    return (
      <AuthLayout
        description={
          // Netral: api tidak memberi tahu apakah email terdaftar.
          <>
            Bila{" "}
            <strong className="text-foreground">{actionData.sentTo}</strong>{" "}
            terdaftar, kami sudah mengirim tautan untuk membuat kata sandi baru.
            Tautan berlaku 1 jam.
          </>
        }
        footer={SIGN_IN_FOOTER}
        title="Cek email Anda"
      >
        <ForgotPasswordForm defaultEmail={actionData.sentTo} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      description="Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru."
      footer={SIGN_IN_FOOTER}
      title="Lupa kata sandi"
    >
      <ForgotPasswordForm formError={actionData?.formError} />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
