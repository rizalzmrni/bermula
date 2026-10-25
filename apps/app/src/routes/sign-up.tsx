import { APP_NAME } from "@bermula/core/brand";
import { data, Link, redirect } from "react-router";

import {
  getSignUpErrorMessage,
  signUpWithEmail,
} from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { ResendVerificationForm } from "../features/auth/resend-verification-form";
import { signUpSchema } from "../features/auth/schemas";
import { SignUpForm } from "../features/auth/sign-up-form";
import { getCloudflare } from "../lib/cloudflare";
import { getAccount } from "../lib/session.server";
import type { Route } from "./+types/sign-up";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Daftar — ${APP_NAME}` }];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  if (await getAccount({ context, request })) {
    throw redirect("/");
  }
  return null;
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return data(
      { formError: "Periksa kembali nama, email, dan kata sandi Anda." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await signUpWithEmail({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (!response.ok) {
    return data(
      { formError: await getSignUpErrorMessage(response) },
      { status: response.status }
    );
  }

  // Tanpa sesi: verifikasi email wajib, jadi tidak ada cookie yang diteruskan.
  return { sentTo: parsed.data.email };
};

const SIGN_IN_FOOTER = (
  <p>
    Sudah punya akun?{" "}
    <Link className={AUTH_LINK_CLASS} to="/sign-in">
      Masuk
    </Link>
  </p>
);

const SignUpPage = ({ actionData }: Route.ComponentProps) => {
  if (actionData && "sentTo" in actionData) {
    return (
      <AuthLayout
        description={
          <>
            Kami mengirim tautan verifikasi ke{" "}
            <strong className="text-foreground">{actionData.sentTo}</strong>.
            Buka tautan itu untuk mengaktifkan akun dan langsung masuk.
          </>
        }
        footer={SIGN_IN_FOOTER}
        title="Cek email Anda"
      >
        <ResendVerificationForm defaultEmail={actionData.sentTo} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      description="Isi data berikut untuk membuat akun."
      footer={SIGN_IN_FOOTER}
      title="Buat akun baru"
    >
      <SignUpForm formError={actionData?.formError} />
    </AuthLayout>
  );
};

export default SignUpPage;
