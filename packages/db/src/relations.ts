import { defineRelations } from "drizzle-orm";

import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  twoFactors,
  verifications,
} from "./schema/auth";
import { files } from "./schema/storage";
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
    files,
    invitations,
    members,
    organizations,
    sessions,
    twoFactors,
    users,
    verifications,
  },
  (r) => ({
    accounts: {
      user: r.one.users({ from: r.accounts.userId, to: r.users.id }),
    },
    files: {
      organization: r.one.organizations({
        from: r.files.organizationId,
        to: r.organizations.id,
      }),
      uploader: r.one.users({ from: r.files.uploadedBy, to: r.users.id }),
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
    twoFactors: {
      user: r.one.users({ from: r.twoFactors.userId, to: r.users.id }),
    },
    users: {
      accounts: r.many.accounts({ from: r.users.id, to: r.accounts.userId }),
      invitations: r.many.invitations({
        from: r.users.id,
        to: r.invitations.inviterId,
      }),
      members: r.many.members({ from: r.users.id, to: r.members.userId }),
      sessions: r.many.sessions({ from: r.users.id, to: r.sessions.userId }),
      twoFactors: r.many.twoFactors({
        from: r.users.id,
        to: r.twoFactors.userId,
      }),
    },
  })
);
