import { APP_NAME } from "@bermula/core/brand";
import { organizationInputSchema } from "@bermula/core/organizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { data, redirect, Form as RouterForm, useSubmit } from "react-router";

import { OrganizationForm } from "../features/organizations/organization-form";
import {
  createOrganization,
  getOrganizationErrorMessage,
} from "../features/organizations/organizations-api.server";
import { getSetCookieHeaders } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/organizations-new";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Buat organisasi — ${APP_NAME}` }];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  return null;
};

/** Berhasil: langsung ke dashboard organisasi baru. Gagal: pesan untuk form. */
export const action = async ({ request, context }: Route.ActionArgs) => {
  await requireSession({ context, request });

  const parsed = organizationInputSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return data(
      { formError: "Periksa kembali nama dan alamat organisasi." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const response = await createOrganization({
    api: getCloudflare(context).env.API,
    input: parsed.data,
    request,
  });
  if (!response.ok) {
    return data(
      { formError: await getOrganizationErrorMessage(response) },
      { status: response.status }
    );
  }
  throw redirect(`/o/${parsed.data.slug}`, {
    headers: getSetCookieHeaders(response),
  });
};

const NewOrganizationPage = ({ actionData }: Route.ComponentProps) => {
  const submit = useSubmit();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buat organisasi
        </h1>
        <p className="text-muted-foreground text-sm">
          Organisasi punya dashboard, anggota, dan langganan sendiri, terpisah
          dari akun pribadi Anda.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Detail organisasi</h2>
          </CardTitle>
          <CardDescription>
            Anda menjadi pemilik organisasi ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm
            formError={actionData?.formError}
            render={<RouterForm method="post" />}
            submit={(element) => submit(element)}
            submitLabel="Buat organisasi"
            suggestSlug
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrganizationPage;
