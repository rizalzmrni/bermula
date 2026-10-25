import { APP_NAME } from "@bermula/core/brand";
import { Button } from "@bermula/design-system/components/ui/button";
import { data, Link, redirect } from "react-router";

import {
  getResetPasswordError,
  resetPassword,
} from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { ResetPasswordForm } from "../features/auth/reset-password-form";
import { resetPasswordSchema } from "../features/auth/schemas";
import { getCloudflare } from "../lib/cloudflare";
import { RESET_PASSWORD_SUCCESS_URL } from "../lib/redirect";
import type { Route } from "./+types/reset-password";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Buat kata sandi baru — ${APP_NAME}` }];

// Token ada di URL halaman ini: jangan kirim lewat header Referer ke
// sumber daya/tautan lain, dan jangan simpan di cache.
export const headers = () => ({
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
});

/**
 * Tujuan tautan email (`redirectTo`). Api sudah memeriksa token sebelum
 * mengarahkan ke sini: valid → `?token=`, tidak valid/kedaluwarsa →
 * `?error=INVALID_TOKEN`. Token tetap dicek ulang saat disubmit.
 */
export const loader = ({ request }: Route.LoaderArgs) => {
  const params = new URL(request.url).searchParams;
  const token = params.get("error") ? null : params.get("token");
  return { token: token || null };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return data(
      {
        formError: "Periksa kembali kata sandi baru Anda.",
        invalidLink: false,
      },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await resetPassword({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (!response.ok) {
    const error = await getResetPasswordError(response);
    return data(
      { formError: error.message, invalidLink: error.invalidLink },
      { status: response.status }
    );
  }

  // Tanpa sesi: api mencabut semua sesi, pengguna login dengan kata sandi baru.
  throw redirect(RESET_PASSWORD_SUCCESS_URL);
};

const SIGN_IN_FOOTER = (
  <p>
    Ingat kata sandi Anda?{" "}
    <Link className={AUTH_LINK_CLASS} to="/sign-in">
      Masuk
    </Link>
  </p>
);

const InvalidLink = ({ message }: { message: string }) => (
  <AuthLayout
    description={message}
    footer={SIGN_IN_FOOTER}
    title="Tautan tidak valid"
  >
    <Button className="w-full" render={<Link to="/forgot-password" />}>
      Minta tautan baru
    </Button>
  </AuthLayout>
);

const ResetPasswordPage = ({
  loaderData,
  actionData,
}: Route.ComponentProps) => {
  if (!loaderData.token || actionData?.invalidLink) {
    return (
      <InvalidLink
        message={
          actionData?.formError ??
          "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru untuk melanjutkan."
        }
      />
    );
  }

  return (
    <AuthLayout
      description="Buat kata sandi baru untuk akun Anda. Setelah disimpan, semua perangkat akan dikeluarkan."
      footer={SIGN_IN_FOOTER}
      title="Buat kata sandi baru"
    >
      <ResetPasswordForm
        formError={actionData?.formError}
        token={loaderData.token}
      />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
