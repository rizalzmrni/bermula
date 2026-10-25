import type { QueryDb } from "@bermula/db/client";
import { members, organizations } from "@bermula/db/schema/auth";
import { users } from "@bermula/db/schema/users";

/** Data minimum yang wajib ada sebelum menyimpan data per organisasi. */

export const insertUser = async (db: QueryDb, name: string) => {
  const [user] = await db
    .insert(users)
    .values({ email: `${crypto.randomUUID()}@example.com`, name })
    .returning();
  if (!user) {
    throw new Error("Insert into auth_users returned no row");
  }
  return user;
};

export const insertOrganization = async (db: QueryDb, name: string) => {
  const [organization] = await db
    .insert(organizations)
    .values({ name, slug: crypto.randomUUID() })
    .returning();
  if (!organization) {
    throw new Error("Insert into auth_organizations returned no row");
  }
  return organization;
};

export const insertMember = async (
  db: QueryDb,
  member: { organizationId: string; userId: string; role: string }
) => {
  await db.insert(members).values(member);
};
