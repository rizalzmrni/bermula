import { APP_NAME } from "@bermula/core/brand";
import { isOrganizationManager } from "@bermula/core/organizations";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { data } from "react-router";

import { useAccount } from "../features/account/queries";
import { useCurrentOrganization } from "../features/organizations/current-organization";
import {
  InviteMemberCard,
  MembersCard,
  PendingInvitationsCard,
} from "../features/organizations/members-section";
import { requireOrganization } from "../features/organizations/organization.server";
import {
  cancelInvitation,
  getOrganizationErrorMessage,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "../features/organizations/organizations-api.server";
import {
  membersQueryOptions,
  organizationInvitationsQueryOptions,
} from "../features/organizations/queries";
import {
  MEMBERS_INTENT,
  membersActionSchema,
} from "../features/organizations/schemas";
import type {
  MembersIntent,
  OrganizationActionResult,
} from "../features/organizations/schemas";
import { getCloudflare } from "../lib/cloudflare";
import { getQueryClient } from "../lib/query-client";
import { getServerApiClient, requireSession } from "../lib/session.server";
import type { Route } from "./+types/org-members";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Anggota — ${APP_NAME}` }];

export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const organization = await requireOrganization({
    context,
    request,
    slug: params.slug,
  });
  const queryClient = getQueryClient(context);
  const client = getServerApiClient({ context, request });
  // `prefetchQuery` tidak melempar: bila api gagal, kartu menampilkan state error.
  await Promise.all([
    queryClient.prefetchQuery(membersQueryOptions(client, organization.id)),
    isOrganizationManager(organization.role)
      ? queryClient.prefetchQuery(
          organizationInvitationsQueryOptions(client, organization.id)
        )
      : null,
  ]);
  return { dehydratedState: dehydrate(queryClient) };
};

const respond = (
  result: OrganizationActionResult<MembersIntent>,
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

  const parsed = membersActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return respond(
      { formError: "Periksa kembali isian Anda.", intent: null },
      HTTP_BAD_REQUEST
    );
  }

  const input = parsed.data;
  const args = {
    api: getCloudflare(context).env.API,
    organizationId: organization.id,
    request,
  };
  const call = () => {
    switch (input.intent) {
      case MEMBERS_INTENT.invite: {
        return inviteMember({ ...args, email: input.email, role: input.role });
      }
      case MEMBERS_INTENT.cancelInvitation: {
        return cancelInvitation({ ...args, invitationId: input.invitationId });
      }
      case MEMBERS_INTENT.updateRole: {
        return updateMemberRole({
          ...args,
          memberId: input.memberId,
          role: input.role,
        });
      }
      case MEMBERS_INTENT.removeMember: {
        return removeMember({ ...args, memberId: input.memberId });
      }
      default: {
        throw new Error("Unhandled members intent");
      }
    }
  };

  const response = await call();
  return response.ok
    ? respond({ intent: input.intent, success: true })
    : respond(
        {
          formError: await getOrganizationErrorMessage(response),
          intent: input.intent,
        },
        response.status
      );
};

const MembersPage = ({ loaderData }: Route.ComponentProps) => {
  const organization = useCurrentOrganization();
  const { user } = useAccount();
  const canManage = isOrganizationManager(organization.role);

  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Anggota</h1>
          <p className="text-muted-foreground text-sm">
            Orang yang bisa membuka {organization.name}.
          </p>
        </div>
        {canManage ? <InviteMemberCard /> : null}
        <MembersCard
          currentUserId={user.id}
          organizationId={organization.id}
          role={organization.role}
        />
        {canManage ? (
          <PendingInvitationsCard organizationId={organization.id} />
        ) : null}
      </div>
    </HydrationBoundary>
  );
};

export default MembersPage;
