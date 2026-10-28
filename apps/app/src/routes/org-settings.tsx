import { APP_NAME } from "@bermula/core/brand";
import { data, redirect, useParams } from "react-router";

import {
  OrganizationDangerZone,
  OrganizationProfileCard,
} from "../features/organizations/organization-settings";
import { requireOrganization } from "../features/organizations/organization.server";
import {
  deleteOrganization,
  getOrganizationErrorMessage,
  leaveOrganization,
  updateOrganization,
} from "../features/organizations/organizations-api.server";
import { useCurrentOrganization } from "../features/organizations/queries";
import {
  SETTINGS_INTENT,
  settingsActionSchema,
} from "../features/organizations/schemas";
import type {
  OrganizationActionResult,
  SettingsIntent,
} from "../features/organizations/schemas";
import { getCloudflare } from "../lib/cloudflare";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/org-settings";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Pengaturan organisasi — ${APP_NAME}` }];

const respond = (
  result: OrganizationActionResult<SettingsIntent>,
  status = 200
) => data(result, { status });

export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  await requireSession({ context, request });
  const organization = await requireOrganization({
    context,
    request,
    slug: params.slug,
  });

  const parsed = settingsActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return respond(
      {
        formError: "Periksa kembali nama dan alamat organisasi.",
        intent: null,
      },
      HTTP_BAD_REQUEST
    );
  }

  const input = parsed.data;
  const args = {
    api: getCloudflare(context).env.API,
    organizationId: organization.id,
    request,
  };

  if (input.intent === SETTINGS_INTENT.update) {
    const response = await updateOrganization({
      ...args,
      input: { name: input.name, slug: input.slug },
    });
    if (!response.ok) {
      return respond(
        {
          formError: await getOrganizationErrorMessage(response),
          intent: input.intent,
        },
        response.status
      );
    }
    // Alamat baru = URL baru; halaman lama akan 404 setelah revalidasi.
    if (input.slug !== organization.slug) {
      throw redirect(`/o/${input.slug}/settings`);
    }
    return respond({ intent: input.intent, success: true });
  }

  const response =
    input.intent === SETTINGS_INTENT.delete
      ? await deleteOrganization(args)
      : await leaveOrganization(args);
  if (!response.ok) {
    return respond(
      {
        formError: await getOrganizationErrorMessage(response),
        intent: input.intent,
      },
      response.status
    );
  }
  throw redirect("/");
};

const OrganizationSettingsPage = () => {
  const organization = useCurrentOrganization(useParams().slug ?? "");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pengaturan organisasi
        </h1>
        <p className="text-muted-foreground text-sm">
          Profil dan keanggotaan {organization.name}.
        </p>
      </div>
      <OrganizationProfileCard organization={organization} />
      <OrganizationDangerZone organization={organization} />
    </div>
  );
};

export default OrganizationSettingsPage;
