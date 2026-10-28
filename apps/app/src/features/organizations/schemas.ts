import {
  assignableRoleSchema,
  inviteMemberSchema,
  organizationInputSchema,
} from "@bermula/core/organizations";
import { z } from "zod";

/** Aksi di halaman anggota; dikirim sebagai field `intent` tiap form. */
export const MEMBERS_INTENT = {
  cancelInvitation: "cancel-invitation",
  invite: "invite",
  removeMember: "remove-member",
  updateRole: "update-role",
} as const;

export const membersActionSchema = z.discriminatedUnion("intent", [
  inviteMemberSchema.extend({ intent: z.literal(MEMBERS_INTENT.invite) }),
  z.object({
    intent: z.literal(MEMBERS_INTENT.cancelInvitation),
    invitationId: z.uuid(),
  }),
  z.object({
    intent: z.literal(MEMBERS_INTENT.updateRole),
    memberId: z.uuid(),
    role: assignableRoleSchema,
  }),
  z.object({
    intent: z.literal(MEMBERS_INTENT.removeMember),
    memberId: z.uuid(),
  }),
]);

export type MembersIntent =
  (typeof MEMBERS_INTENT)[keyof typeof MEMBERS_INTENT];

/** Aksi di halaman pengaturan organisasi. */
export const SETTINGS_INTENT = {
  delete: "delete",
  leave: "leave",
  update: "update",
} as const;

export const settingsActionSchema = z.discriminatedUnion("intent", [
  organizationInputSchema.extend({
    intent: z.literal(SETTINGS_INTENT.update),
  }),
  z.object({ intent: z.literal(SETTINGS_INTENT.delete) }),
  z.object({ intent: z.literal(SETTINGS_INTENT.leave) }),
]);

export type SettingsIntent =
  (typeof SETTINGS_INTENT)[keyof typeof SETTINGS_INTENT];

/** Jawaban undangan di `/accept-invitation/:invitationId`. */
export const INVITATION_INTENT = {
  accept: "accept",
  reject: "reject",
} as const;

export const invitationActionSchema = z.object({
  intent: z.enum([INVITATION_INTENT.accept, INVITATION_INTENT.reject]),
});

/** Hasil action organisasi: pesan error per form, atau tanda berhasil. */
export type OrganizationActionResult<Intent extends string> =
  | { intent: Intent | null; formError: string }
  | { intent: Intent; success: true };

export const isActionError = <Intent extends string>(
  result: OrganizationActionResult<Intent> | undefined
): result is { intent: Intent | null; formError: string } =>
  result !== undefined && "formError" in result;
