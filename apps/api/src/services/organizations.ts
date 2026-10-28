import type { QueryDb } from "@bermula/db/client";
import { invitations, members, organizations } from "@bermula/db/schema/auth";
import { users } from "@bermula/db/schema/users";
import { and, asc, eq, gt, sql } from "drizzle-orm";

import { ApiError } from "../lib/errors";

// Status undangan better-auth; hanya `pending` yang masih bisa dijawab.
const INVITATION_PENDING = "pending";

/**
 * Keanggotaan pengguna di organisasi dari path URL. Organisasi yang tidak ada
 * dan yang bukan milik pengguna sama-sama 404, agar keberadaan organisasi
 * lain tidak bisa ditebak.
 */
export const getOrganizationMembership = async ({
  db,
  organizationId,
  userId,
}: {
  db: QueryDb;
  organizationId: string;
  userId: string;
}) => {
  const [membership] = await db
    .select({
      id: organizations.id,
      logo: organizations.logo,
      memberId: members.id,
      name: organizations.name,
      role: members.role,
      slug: organizations.slug,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new ApiError({
      code: "ORGANIZATION_NOT_FOUND",
      message: "Organisasi tidak ditemukan.",
      status: 404,
    });
  }

  return membership;
};

export type OrganizationMembership = Awaited<
  ReturnType<typeof getOrganizationMembership>
>;

/** Organisasi yang diikuti pengguna beserta role-nya. */
export const listUserOrganizations = ({
  db,
  userId,
}: {
  db: QueryDb;
  userId: string;
}) =>
  db
    .select({
      createdAt: organizations.createdAt,
      id: organizations.id,
      logo: organizations.logo,
      name: organizations.name,
      role: members.role,
      slug: organizations.slug,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, userId))
    .orderBy(asc(organizations.name), asc(organizations.id));

export const listMembers = ({
  db,
  organizationId,
}: {
  db: QueryDb;
  organizationId: string;
}) =>
  db
    .select({
      createdAt: members.createdAt,
      email: users.email,
      id: members.id,
      image: users.image,
      name: users.name,
      role: members.role,
      userId: users.id,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, organizationId))
    .orderBy(asc(members.createdAt), asc(members.id));

/** Undangan yang masih bisa diterima: `pending` dan belum kedaluwarsa per `now`. */
const isOpenInvitation = (now: Date) =>
  and(
    eq(invitations.status, INVITATION_PENDING),
    gt(invitations.expiresAt, now)
  );

export const listOrganizationInvitations = ({
  db,
  now,
  organizationId,
}: {
  db: QueryDb;
  now: Date;
  organizationId: string;
}) =>
  db
    .select({
      createdAt: invitations.createdAt,
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      id: invitations.id,
      inviterName: users.name,
      role: invitations.role,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.inviterId, users.id))
    .where(
      and(eq(invitations.organizationId, organizationId), isOpenInvitation(now))
    )
    .orderBy(asc(invitations.createdAt), asc(invitations.id));

/** Undangan untuk email pengguna; dicocokkan tanpa membedakan huruf besar/kecil. */
export const listUserInvitations = ({
  db,
  email,
  now,
}: {
  db: QueryDb;
  email: string;
  now: Date;
}) =>
  db
    .select({
      expiresAt: invitations.expiresAt,
      id: invitations.id,
      inviterName: users.name,
      organizationName: organizations.name,
      role: invitations.role,
    })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
    .innerJoin(users, eq(invitations.inviterId, users.id))
    .where(
      and(
        sql`lower(${invitations.email}) = ${email.toLowerCase()}`,
        isOpenInvitation(now)
      )
    )
    .orderBy(asc(invitations.expiresAt), asc(invitations.id));
