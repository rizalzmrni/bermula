import { defineRelations } from "drizzle-orm";

import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  verifications,
} from "./schema/auth";
import { users } from "./schema/users";

/**
 * Relasi untuk relational query (`db.query.<table>.findMany({ with })`).
 * Kunci tabel auth wajib bentuk jamak nama model better-auth (adapter memakai
 * `usePlural: true`); nama relasinya mengikuti generator adapter (`user`,
 * `sessions`, ...) agar join adapter menemukan relasi yang benar. Tabel domain
 * baru diimpor dari `src/schema/<domain>.ts` dan didaftarkan di sini.
 */
export const relations = defineRelations(
  {
    accounts,
    invitations,
    members,
    organizations,
    sessions,
    users,
    verifications,
  },
  (r) => ({
    accounts: {
      user: r.one.users({ from: r.accounts.userId, to: r.users.id }),
    },
    invitations: {
      organization: r.one.organizations({
        from: r.invitations.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({ from: r.invitations.inviterId, to: r.users.id }),
    },
    members: {
      organization: r.one.organizations({
        from: r.members.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({ from: r.members.userId, to: r.users.id }),
    },
    organizations: {
      invitations: r.many.invitations({
        from: r.organizations.id,
        to: r.invitations.organizationId,
      }),
      members: r.many.members({
        from: r.organizations.id,
        to: r.members.organizationId,
      }),
    },
    sessions: {
      user: r.one.users({ from: r.sessions.userId, to: r.users.id }),
    },
    users: {
      accounts: r.many.accounts({ from: r.users.id, to: r.accounts.userId }),
      invitations: r.many.invitations({
        from: r.users.id,
        to: r.invitations.inviterId,
      }),
      members: r.many.members({ from: r.users.id, to: r.members.userId }),
      sessions: r.many.sessions({ from: r.users.id, to: r.sessions.userId }),
    },
  })
);
