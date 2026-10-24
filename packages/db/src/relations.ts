import { defineRelations } from "drizzle-orm";

import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "./schema/auth";

/**
 * Relasi untuk relational query (`db.query.<table>.findMany({ with })`).
 * Kunci tabel auth wajib sama dengan nama model better-auth; nama relasinya
 * mengikuti generator adapter (`sessions`, `members`, ...) agar join adapter
 * menemukan relasi yang benar. Tabel domain baru diimpor dari
 * `src/schema/<domain>.ts` dan didaftarkan di sini.
 */
export const relations = defineRelations(
  {
    account,
    invitation,
    member,
    organization,
    session,
    user,
    verification,
  },
  (r) => ({
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.invitation.inviterId, to: r.user.id }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
    },
    organization: {
      invitations: r.many.invitation({
        from: r.organization.id,
        to: r.invitation.organizationId,
      }),
      members: r.many.member({
        from: r.organization.id,
        to: r.member.organizationId,
      }),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    user: {
      accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
      invitations: r.many.invitation({
        from: r.user.id,
        to: r.invitation.inviterId,
      }),
      members: r.many.member({ from: r.user.id, to: r.member.userId }),
      sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    },
  })
);
