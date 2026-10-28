import { formatDate } from "@bermula/core/format";
import {
  ORGANIZATION_ROLE,
  inviteMemberSchema,
  isOrganizationManager,
  isOrganizationOwner,
} from "@bermula/core/organizations";
import { formElementSubmit, useAppForm } from "@bermula/data/form";
import { ConfirmDialog } from "@bermula/design-system/components/feedback/confirm-dialog";
import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { ErrorState } from "@bermula/design-system/components/feedback/error-state";
import {
  LoadingSkeleton,
  SKELETON_VARIANT,
} from "@bermula/design-system/components/feedback/loading-skeleton";
import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bermula/design-system/components/ui/avatar";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { Button } from "@bermula/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bermula/design-system/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bermula/design-system/components/ui/dropdown-menu";
import {
  IconCircleCheck,
  IconDots,
  IconMailOff,
  IconUserMinus,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { useFetcher } from "react-router";

import { getInitials } from "../../lib/initials";
import { FormErrorAlert } from "../auth/form-error-alert";
import { formatRole } from "./labels";
import { useMembers, useOrganizationInvitations } from "./queries";
import type { Member } from "./queries";
import { MEMBERS_INTENT, isActionError } from "./schemas";
import type { MembersIntent, OrganizationActionResult } from "./schemas";

type MembersActionResult = OrganizationActionResult<MembersIntent>;

const ROLE_OPTIONS = [
  {
    label: "Anggota — memakai data organisasi",
    value: ORGANIZATION_ROLE.member,
  },
  {
    label: "Admin — juga mengundang & mengelola anggota",
    value: ORGANIZATION_ROLE.admin,
  },
];

const errorFor = (
  result: MembersActionResult | undefined,
  intents: readonly MembersIntent[]
) =>
  isActionError(result) &&
  (result.intent === null || intents.includes(result.intent))
    ? result.formError
    : undefined;

const InviteForm = ({ onSent }: { onSent: (email: string) => void }) => {
  const fetcher = useFetcher<MembersActionResult>({ key: "invite-member" });
  const form = useAppForm({
    defaultValues: { email: "", role: ORGANIZATION_ROLE.member as string },
    validators: { onDynamic: inviteMemberSchema },
    ...formElementSubmit(async (element) => {
      const email = new FormData(element).get("email");
      await fetcher.submit(element);
      if (typeof email === "string") {
        onSent(email);
      }
    }),
  });

  return (
    <form.AppForm>
      <form.Form render={<fetcher.Form method="post" />}>
        <FormErrorAlert
          message={errorFor(fetcher.data, [MEMBERS_INTENT.invite])}
        />
        <input name="intent" type="hidden" value={MEMBERS_INTENT.invite} />
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              autoComplete="off"
              label="Email"
              required
              type="email"
            />
          )}
        </form.AppField>
        <form.AppField name="role">
          {(field) => (
            <field.RadioGroupField
              label="Role"
              options={ROLE_OPTIONS}
              required
            />
          )}
        </form.AppField>
        <form.SubmitButton className="w-full sm:w-fit" pendingLabel="Mengirim…">
          Kirim undangan
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};

/** Form undangan (owner/admin). Undangan berlaku 2 hari dan dikirim lewat email. */
export const InviteMemberCard = () => {
  const fetcher = useFetcher<MembersActionResult>({ key: "invite-member" });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sent =
    fetcher.data !== undefined && "success" in fetcher.data && sentTo !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Undang anggota</h2>
        </CardTitle>
        <CardDescription>
          Undangan dikirim lewat email dan berlaku selama 2 hari.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sent ? (
          <Alert>
            <IconCircleCheck aria-hidden="true" />
            <AlertDescription>Undangan terkirim ke {sentTo}.</AlertDescription>
          </Alert>
        ) : null}
        {/* Form baru setelah terkirim, agar isian email kosong kembali. */}
        <InviteForm key={sent ? sentTo : "editing"} onSent={setSentTo} />
      </CardContent>
    </Card>
  );
};

interface MemberRowProps {
  member: Member;
  canManage: boolean;
  isSelf: boolean;
}

const MemberActions = ({ member }: { member: Member }) => {
  const fetcher = useFetcher<MembersActionResult>({ key: "member-actions" });
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isAdmin = member.role.split(",").includes(ORGANIZATION_ROLE.admin);
  const nextRole = isAdmin ? ORGANIZATION_ROLE.member : ORGANIZATION_ROLE.admin;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Aksi untuk ${member.name}`}
              disabled={fetcher.state !== "idle"}
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <IconDots aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              fetcher.submit(
                {
                  intent: MEMBERS_INTENT.updateRole,
                  memberId: member.id,
                  role: nextRole,
                },
                { method: "post" }
              )
            }
          >
            {isAdmin ? "Jadikan anggota" : "Jadikan admin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmRemove(true)}
            variant="destructive"
          >
            <IconUserMinus />
            Keluarkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        confirmLabel="Keluarkan"
        description={`${member.name} tidak bisa lagi membuka organisasi ini. Anda bisa mengundangnya kembali nanti.`}
        destructive
        onConfirm={() =>
          fetcher.submit(
            { intent: MEMBERS_INTENT.removeMember, memberId: member.id },
            { method: "post" }
          )
        }
        onOpenChange={setConfirmRemove}
        open={confirmRemove}
        title={`Keluarkan ${member.name}?`}
      />
    </>
  );
};

const MemberRow = ({ member, canManage, isSelf }: MemberRowProps) => (
  <li className="flex items-center gap-3 py-3">
    <Avatar className="size-9">
      {member.image ? <AvatarImage alt="" src={member.image} /> : null}
      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
    </Avatar>
    <span className="grid min-w-0 flex-1">
      <span className="truncate font-medium">
        {member.name}
        {isSelf ? (
          <span className="text-muted-foreground font-normal"> (Anda)</span>
        ) : null}
      </span>
      <span className="text-muted-foreground truncate text-sm">
        {member.email}
      </span>
    </span>
    <Badge variant={isOrganizationOwner(member.role) ? "default" : "secondary"}>
      {formatRole(member.role)}
    </Badge>
    {/* Pemilik dan diri sendiri tidak diubah dari sini (keluar lewat Pengaturan). */}
    {canManage && !isSelf && !isOrganizationOwner(member.role) ? (
      <MemberActions member={member} />
    ) : (
      <span aria-hidden="true" className="size-7" />
    )}
  </li>
);

interface MembersCardProps {
  organizationId: string;
  role: string;
  currentUserId: string;
}

export const MembersCard = ({
  organizationId,
  role,
  currentUserId,
}: MembersCardProps) => {
  const members = useMembers(organizationId);
  const actions = useFetcher<MembersActionResult>({ key: "member-actions" });
  const canManage = isOrganizationManager(role);

  const renderContent = () => {
    if (members.isPending) {
      return (
        <LoadingSkeleton
          label="Memuat anggota"
          variant={SKELETON_VARIANT.list}
        />
      );
    }
    if (members.isError) {
      return (
        <ErrorState
          description="Daftar anggota tidak bisa dimuat."
          onRetry={() => members.refetch()}
          retrying={members.isFetching}
        />
      );
    }
    return (
      <ul className="divide-border flex flex-col divide-y">
        {members.data.map((member) => (
          <MemberRow
            canManage={canManage}
            isSelf={member.userId === currentUserId}
            key={member.id}
            member={member}
          />
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Anggota</h2>
        </CardTitle>
        <CardDescription>
          {members.isSuccess
            ? `${members.data.length} orang di organisasi ini.`
            : "Orang yang bisa membuka organisasi ini."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormErrorAlert
          message={errorFor(actions.data, [
            MEMBERS_INTENT.updateRole,
            MEMBERS_INTENT.removeMember,
          ])}
        />
        {renderContent()}
      </CardContent>
    </Card>
  );
};

/** Undangan yang belum dijawab (owner/admin): bisa dibatalkan sebelum diterima. */
export const PendingInvitationsCard = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const invitations = useOrganizationInvitations(organizationId, {
    enabled: true,
  });
  const fetcher = useFetcher<MembersActionResult>({ key: "cancel-invitation" });

  const renderContent = () => {
    if (invitations.isPending) {
      return (
        <LoadingSkeleton
          label="Memuat undangan"
          variant={SKELETON_VARIANT.list}
        />
      );
    }
    if (invitations.isError) {
      return (
        <ErrorState
          description="Daftar undangan tidak bisa dimuat."
          onRetry={() => invitations.refetch()}
          retrying={invitations.isFetching}
        />
      );
    }
    if (invitations.data.length === 0) {
      return (
        <EmptyState
          description="Undangan yang belum diterima akan muncul di sini."
          icon={IconUsers}
          title="Tidak ada undangan terbuka"
        />
      );
    }
    return (
      <ul className="divide-border flex flex-col divide-y">
        {invitations.data.map((invitation) => (
          <li className="flex items-center gap-3 py-3" key={invitation.id}>
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-medium">{invitation.email}</span>
              <span className="text-muted-foreground text-sm">
                {formatRole(invitation.role)} · diundang{" "}
                {invitation.inviterName} · berlaku sampai{" "}
                {formatDate(new Date(invitation.expiresAt))}
              </span>
            </span>
            <fetcher.Form method="post">
              <input
                name="intent"
                type="hidden"
                value={MEMBERS_INTENT.cancelInvitation}
              />
              <input name="invitationId" type="hidden" value={invitation.id} />
              <Button
                aria-label={`Batalkan undangan untuk ${invitation.email}`}
                disabled={fetcher.state !== "idle"}
                size="sm"
                type="submit"
                variant="outline"
              >
                <IconMailOff aria-hidden="true" />
                Batalkan
              </Button>
            </fetcher.Form>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Undangan terbuka</h2>
        </CardTitle>
        <CardDescription>Belum diterima dan belum kedaluwarsa.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormErrorAlert
          message={errorFor(fetcher.data, [MEMBERS_INTENT.cancelInvitation])}
        />
        {renderContent()}
      </CardContent>
    </Card>
  );
};
