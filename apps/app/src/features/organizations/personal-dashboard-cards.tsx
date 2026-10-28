import { formatDate } from "@bermula/core/format";
import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { ErrorState } from "@bermula/design-system/components/feedback/error-state";
import {
  LoadingSkeleton,
  SKELETON_VARIANT,
} from "@bermula/design-system/components/feedback/loading-skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bermula/design-system/components/ui/avatar";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { buttonVariants } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import { IconBuildingStore, IconMail, IconPlus } from "@tabler/icons-react";
import { Link } from "react-router";

import { getInitials } from "../../lib/initials";
import { formatRole } from "./labels";
import { useMyInvitations, useOrganizations } from "./queries";

const CreateOrganizationLink = ({
  variant,
}: {
  variant: "default" | "outline";
}) => (
  <Link
    className={buttonVariants({ size: "sm", variant })}
    to="/organizations/new"
  >
    <IconPlus aria-hidden="true" />
    Buat organisasi
  </Link>
);

const OrganizationList = () => {
  const organizations = useOrganizations();

  if (organizations.isPending) {
    return (
      <LoadingSkeleton
        label="Memuat organisasi"
        variant={SKELETON_VARIANT.list}
      />
    );
  }
  if (organizations.isError) {
    return (
      <ErrorState
        description="Daftar organisasi tidak bisa dimuat."
        onRetry={() => organizations.refetch()}
        retrying={organizations.isFetching}
      />
    );
  }
  if (organizations.data.length === 0) {
    return (
      <EmptyState
        action={<CreateOrganizationLink variant="default" />}
        description="Buat organisasi untuk bekerja bersama tim, misalnya toko atau perusahaan Anda."
        icon={IconBuildingStore}
        title="Belum ada organisasi"
      />
    );
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {organizations.data.map((organization) => (
        <li key={organization.id}>
          <Link
            className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring -mx-2 flex items-center gap-3 rounded-md px-2 py-3 outline-none focus-visible:ring-2"
            to={`/o/${organization.slug}`}
          >
            <Avatar className="size-9 rounded-lg">
              {organization.logo ? (
                <AvatarImage alt="" src={organization.logo} />
              ) : null}
              <AvatarFallback className="rounded-lg">
                {getInitials(organization.name)}
              </AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-medium">{organization.name}</span>
              <span className="text-muted-foreground truncate text-sm">
                /o/{organization.slug}
              </span>
            </span>
            <Badge variant="secondary">{formatRole(organization.role)}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
};

/** Organisasi yang diikuti pengguna, dengan pintasan ke dashboard masing-masing. */
export const OrganizationsCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <h2>Organisasi</h2>
      </CardTitle>
      <CardDescription>Dashboard tim yang Anda ikuti.</CardDescription>
      <CardAction>
        <CreateOrganizationLink variant="outline" />
      </CardAction>
    </CardHeader>
    <CardContent>
      <OrganizationList />
    </CardContent>
  </Card>
);

/**
 * Undangan yang menunggu jawaban. Tidak tampil sama sekali bila kosong, agar
 * dashboard tidak dipenuhi kartu yang jarang berisi.
 */
export const InvitationsCard = () => {
  const invitations = useMyInvitations();

  if (
    invitations.isPending ||
    (invitations.isSuccess && invitations.data.length === 0)
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Undangan</h2>
        </CardTitle>
        <CardDescription>
          Anda diundang bergabung ke organisasi berikut.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.isError ? (
          <ErrorState
            description="Undangan tidak bisa dimuat."
            onRetry={() => invitations.refetch()}
            retrying={invitations.isFetching}
          />
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {invitations.data.map((invitation) => (
              <li
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
                key={invitation.id}
              >
                <IconMail
                  aria-hidden="true"
                  className="text-muted-foreground hidden size-5 sm:block"
                />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-medium">
                    {invitation.organizationName}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    Dari {invitation.inviterName} sebagai{" "}
                    {formatRole(invitation.role)} · berlaku sampai{" "}
                    {formatDate(new Date(invitation.expiresAt))}
                  </span>
                </span>
                <Link
                  className={buttonVariants({ size: "sm" })}
                  to={`/accept-invitation/${invitation.id}`}
                >
                  Lihat undangan
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
