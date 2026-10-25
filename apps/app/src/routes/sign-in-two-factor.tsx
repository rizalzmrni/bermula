import { APP_NAME } from "@bermula/core/brand";
import { Button } from "@bermula/design-system/components/ui/button";
import { data, Link, redirect } from "react-router";

import {
  getTwoFactorError,
  hasTwoFactorChallenge,
  verifyTwoFactor,
} from "../features/auth/auth-api.server";
import { AUTH_LINK_CLASS, AuthLayout } from "../features/auth/auth-layout";
import { FormErrorAlert } from "../features/auth/form-error-alert";
import {
  parseTwoFactorMethod,
  twoFactorSchema,
} from "../features/auth/schemas";
import { TwoFactorForm } from "../features/auth/two-factor-form";
import { getSetCookieHeaders } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import { getSafeRedirect } from "../lib/redirect";
import { getAccount } from "../lib/session.server";
import type { Route } from "./+types/sign-in-two-factor";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Verifikasi dua langkah — ${APP_NAME}` }];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo");
  if (await getAccount({ context, request })) {
    throw redirect(getSafeRedirect(redirectTo));
  }
  // Tanpa tantangan yang berjalan (dibuka langsung/kedaluwarsa), mulai dari login.
  if (!hasTwoFactorChallenge(request)) {
    throw redirect("/sign-in");
  }
  return {
    method: parseTwoFactorMethod(searchParams.get("method")),
    redirectTo,
  };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const parsed = twoFactorSchema.safeParse({
    code: formData.get("code"),
    method: formData.get("method"),
    trustDevice: formData.get("trustDevice") ?? undefined,
  });
  if (!parsed.success) {
    return data(
      { formError: "Periksa kembali kode Anda.", restart: false },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await verifyTwoFactor({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (!response.ok) {
    const { message, restart } = await getTwoFactorError(response);
    return data({ formError: message, restart }, { status: response.status });
  }

  // Cookie sesi (dan `trust_device` bila dicentang) diteruskan ke browser.
  throw redirect(getSafeRedirect(formData.get("redirectTo")), {
    headers: getSetCookieHeaders(response),
  });
};

const TwoFactorPage = ({ loaderData, actionData }: Route.ComponentProps) => (
  <AuthLayout
    description="Akun Anda dilindungi verifikasi dua langkah."
    footer={
      <p>
        Bukan Anda?{" "}
        <Link className={AUTH_LINK_CLASS} to="/sign-in">
          Masuk dengan akun lain
        </Link>
      </p>
    }
    title="Verifikasi dua langkah"
  >
    {actionData?.restart ? (
      <div className="flex flex-col gap-4">
        <FormErrorAlert message={actionData.formError} />
        <Button render={<Link to="/sign-in" />}>
          Kembali ke halaman masuk
        </Button>
      </div>
    ) : (
      <TwoFactorForm
        formError={actionData?.formError}
        // Ganti cara verifikasi = form baru (isian & skema validasi berbeda).
        key={loaderData.method}
        method={loaderData.method}
        redirectTo={loaderData.redirectTo}
      />
    )}
  </AuthLayout>
);

export default TwoFactorPage;
