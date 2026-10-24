import type { Db } from "@bermula/db/client";
import { members, organizations } from "@bermula/db/schema/auth";
import { and, eq } from "drizzle-orm";

import { ApiError } from "../lib/errors";

/**
 * Organisasi aktif beserta role pengguna di dalamnya. Keanggotaan dicek di
 * sini, bukan dipercaya dari sesi: pengguna bisa saja sudah dikeluarkan dari
 * organisasi setelah sesinya dibuat.
 */
export const getActiveMembership = async ({
  db,
  organizationId,
  userId,
}: {
  db: Db;
  organizationId: string;
  userId: string;
}) => {
  const [membership] = await db
    .select({
      id: organizations.id,
      isPersonal: organizations.isPersonal,
      logo: organizations.logo,
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
      code: "NOT_A_MEMBER",
      message: "Anda bukan anggota organisasi ini.",
      status: 403,
    });
  }

  return membership;
};
