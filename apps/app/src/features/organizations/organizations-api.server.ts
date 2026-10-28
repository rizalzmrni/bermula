import type { OrganizationInput } from "@bermula/core/organizations";
import { z } from "zod";

import { postApiJson } from "../../lib/api-client";
import type { ApiBinding } from "../../lib/api-client";
import {
  HTTP_TOO_MANY_REQUESTS,
  RATE_LIMITED_MESSAGE,
  readErrorCode,
} from "../../lib/api-error";

/**
 * Mutasi organisasi lewat endpoint plugin organization better-auth
 * (`/api/auth/organization/*`) via Service Binding. better-auth yang mengecek
 * izin (owner/admin); organisasi selalu dikirim eksplisit, bukan dari sesi.
 */

interface RequestArgs {
  api: ApiBinding;
  request: Request;
}

type OrganizationArgs = RequestArgs & { organizationId: string };

const post = (args: RequestArgs, path: `/${string}`, body: unknown) =>
  postApiJson({ ...args, body, path: `/api/auth/organization${path}` });

export const createOrganization = ({
  input,
  ...args
}: RequestArgs & { input: OrganizationInput }) =>
  // Organisasi aktif di sesi tetap organisasi pribadi; konteks organisasi
  // diambil dari URL `/o/:slug` (docs/user-organization-dashboards.md).
  post(args, "/create", { ...input, keepCurrentActiveOrganization: true });

export const updateOrganization = ({
  organizationId,
  input,
  ...args
}: OrganizationArgs & { input: OrganizationInput }) =>
  post(args, "/update", { data: input, organizationId });

export const deleteOrganization = ({
  organizationId,
  ...args
}: OrganizationArgs) => post(args, "/delete", { organizationId });

export const leaveOrganization = ({
  organizationId,
  ...args
}: OrganizationArgs) => post(args, "/leave", { organizationId });

export const inviteMember = ({
  organizationId,
  email,
  role,
  ...args
}: OrganizationArgs & { email: string; role: string }) =>
  post(args, "/invite-member", { email, organizationId, role });

export const cancelInvitation = ({
  invitationId,
  ...args
}: RequestArgs & { invitationId: string }) =>
  post(args, "/cancel-invitation", { invitationId });

export const updateMemberRole = ({
  organizationId,
  memberId,
  role,
  ...args
}: OrganizationArgs & { memberId: string; role: string }) =>
  post(args, "/update-member-role", { memberId, organizationId, role });

export const removeMember = ({
  organizationId,
  memberId,
  ...args
}: OrganizationArgs & { memberId: string }) =>
  post(args, "/remove-member", { memberIdOrEmail: memberId, organizationId });

export const acceptInvitation = ({
  invitationId,
  ...args
}: RequestArgs & { invitationId: string }) =>
  post(args, "/accept-invitation", { invitationId });

export const rejectInvitation = ({
  invitationId,
  ...args
}: RequestArgs & { invitationId: string }) =>
  post(args, "/reject-invitation", { invitationId });

const acceptedSchema = z.object({
  member: z.object({ organizationId: z.uuid() }),
});

/** ID organisasi dari respons `accept-invitation`, untuk redirect ke dashboard-nya. */
export const readAcceptedOrganizationId = async (response: Response) => {
  const parsed = acceptedSchema.safeParse(
    await response.json().catch(() => null)
  );
  return parsed.success ? parsed.data.member.organizationId : null;
};

const SLUG_TAKEN = "Alamat organisasi ini sudah dipakai.";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION:
    "Verifikasi email Anda terlebih dahulu.",
  INVALID_ORGANIZATION_INPUT: "Periksa kembali nama dan alamat organisasi.",
  INVITATION_NOT_FOUND: "Undangan tidak ditemukan atau sudah tidak berlaku.",
  ORGANIZATION_ALREADY_EXISTS: SLUG_TAKEN,
  ORGANIZATION_SLUG_ALREADY_TAKEN: SLUG_TAKEN,
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION:
    "Orang ini sudah menjadi anggota.",
  USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION:
    "Email ini sudah diundang dan undangannya masih berlaku.",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER:
    "Anda tidak berhak mengeluarkan anggota ini.",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION:
    "Hanya pemilik yang bisa menghapus organisasi.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION:
    "Hanya pemilik atau admin yang bisa mengundang.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE:
    "Anda tidak berhak mengundang dengan role ini.",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER:
    "Anda tidak berhak mengubah role anggota ini.",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION:
    "Hanya pemilik atau admin yang bisa mengubah organisasi.",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION:
    "Undangan ini untuk email lain. Masuk dengan email yang diundang.",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER:
    "Anda satu-satunya pemilik. Jadikan anggota lain pemilik atau hapus organisasi.",
};

/** Pesan untuk form dari status + `code` better-auth. */
export const getOrganizationErrorMessage = async (response: Response) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    return RATE_LIMITED_MESSAGE;
  }
  const code = await readErrorCode(response);
  return (
    (code ? ERROR_MESSAGES[code] : undefined) ??
    "Gagal menyimpan perubahan. Silakan coba lagi."
  );
};
