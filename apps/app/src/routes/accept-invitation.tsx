import { APP_NAME } from "@bermula/core/brand";
import { formatDate } from "@bermula/core/format";
import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { ErrorState } from "@bermula/design-system/components/feedback/error-state";
import {
  LoadingSkeleton,
  SKELETON_VARIANT,
} from "@bermula/design-system/components/feedback/loading-skeleton";
import { SubmitButton } from "@bermula/design-system/components/form/submit-button";
import { buttonVariants } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { IconMailQuestion } from "@tabler/icons-react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import {
  Link,
  Form as RouterForm,
  data,
  redirect,
  useNavigation,
  useParams,
} from "react-router";

import { useAccount } from "../features/account/queries";
import { FormErrorAlert } from "../features/auth/form-error-alert";
import { formatRole } from "../features/organizations/labels";
import {
  acceptInvitation,
  getOrganizationErrorMessage,
  readAcceptedOrganizationId,
  rejectInvitation,
} from "../features/organizations/organizations-api.server";
import {
  myInvitationsQueryOptions,
  organizationsQueryOptions,
  useMyInvitations,
} from "../features/organizations/queries";
import {
  INVITATION_INTENT,
  invitationActionSchema,
} from "../features/organizations/schemas";
import { getCloudflare } from "../lib/cloudflare";
import { getQueryClient } from "../lib/query-client";
import { getServerApiClient, requireSession } from "../lib/session.server";
import type { Route } from "./+types/accept-invitation";

const HTTP_BAD_REQUEST = 400;

export const meta = () => [{ title: `Undangan organisasi — ${APP_NAME}` }];

/** Tanpa sesi → login dengan `redirectTo` kembali ke undangan ini. */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const queryClient = getQueryClient(context);
  await queryClient.prefetchQuery(
    myInvitationsQueryOptions(getServerApiClient({ context, request }))
  );
  return { dehydratedState: dehydrate(queryClient) };
};

/** Terima → dashboard organisasinya. Tolak → dashboard pribadi. */
export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  await requireSession({ context, request });
  const parsed = invitationActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success || !params.invitationId) {
    return data(
      { formError: "Pilih terima atau tolak undangan." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const args = {
    api: getCloudflare(context).env.API,
    invitationId: params.invitationId,
    request,
  };
  if (parsed.data.intent === INVITATION_INTENT.reject) {
    const response = await rejectInvitation(args);
    if (!response.ok) {
      return data(
        { formError: await getOrganizationErrorMessage(response) },
        { status: response.status }
      );
    }
    throw redirect("/");
  }

  const response = await acceptInvitation(args);
  if (!response.ok) {
    return data(
      { formError: await getOrganizationErrorMessage(response) },
      { status: response.status }
    );
  }
  const organizationId = await readAcceptedOrganizationId(response);
  const organizations = await getQueryClient(context).fetchQuery(
    organizationsQueryOptions(getServerApiClient({ context, request }))
  );
  const joined = organizations.find((item) => item.id === organizationId);
  throw redirect(joined ? `/o/${joined.slug}` : "/");
};

const InvitationNotFound = () => {
  const { email } = useAccount().user;
  return (
    <EmptyState
      action={
        <Link className={buttonVariants({ variant: "outline" })} to="/">
          Ke dashboard
        </Link>
      }
      description={`Undangan mungkin sudah dijawab, dibatalkan, kedaluwarsa, atau ditujukan ke email lain. Anda masuk sebagai ${email}.`}
      icon={IconMailQuestion}
      title="Undangan tidak ditemukan"
    />
  );
};

const InvitationCard = ({ formError }: { formError: string | undefined }) => {
  const { invitationId } = useParams();
  const invitations = useMyInvitations();
  const navigation = useNavigation();
  const pendingIntent = navigation.formData?.get("intent");

  if (invitations.isPending) {
    return (
      <LoadingSkeleton
        label="Memuat undangan"
        variant={SKELETON_VARIANT.cards}
      />
    );
  }
  if (invitations.isError) {
    return (
      <ErrorState
        description="Undangan tidak bisa dimuat."
        onRetry={() => invitations.refetch()}
        retrying={invitations.isFetching}
      />
    );
  }
  const invitation = invitations.data.find((item) => item.id === invitationId);
  if (!invitation) {
    return <InvitationNotFound />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{invitation.organizationName}</h2>
        </CardTitle>
        <CardDescription>
          {invitation.inviterName} mengundang Anda sebagai{" "}
          {formatRole(invitation.role)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormErrorAlert message={formError} />
        <p className="text-muted-foreground text-sm">
          Undangan berlaku sampai {formatDate(new Date(invitation.expiresAt))}.
        </p>
      </CardContent>
      <CardFooter>
        <RouterForm
          className="flex w-full flex-col gap-2 sm:flex-row"
          method="post"
        >
          <SubmitButton
            className="w-full sm:w-fit"
            name="intent"
            pending={pendingIntent === INVITATION_INTENT.accept}
            pendingLabel="Bergabung…"
            value={INVITATION_INTENT.accept}
          >
            Terima undangan
          </SubmitButton>
          <SubmitButton
            className="w-full sm:w-fit"
            name="intent"
            pending={pendingIntent === INVITATION_INTENT.reject}
            pendingLabel="Menolak…"
            value={INVITATION_INTENT.reject}
            variant="outline"
          >
            Tolak
          </SubmitButton>
        </RouterForm>
      </CardFooter>
    </Card>
  );
};

const AcceptInvitationPage = ({
  loaderData,
  actionData,
}: Route.ComponentProps) => (
  <HydrationBoundary state={loaderData.dehydratedState}>
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Undangan organisasi
        </h1>
        <p className="text-muted-foreground text-sm">
          Bergabung memberi Anda akses ke dashboard organisasi tersebut.
        </p>
      </div>
      <InvitationCard formError={actionData?.formError} />
    </div>
  </HydrationBoundary>
);

export default AcceptInvitationPage;
