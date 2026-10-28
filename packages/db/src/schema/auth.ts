import {
  boolean,
  index,
  integer,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "../columns";
import { users } from "./users";

/**
 * Tabel milik better-auth (inti + plugin organization), selain `users`.
 * Nama properti harus sama dengan field better-auth, dan nama ekspor adalah
 * bentuk jamak nama model (`session` → `sessions`) karena adapter memakai
 * `usePlural: true`. Kolom disalin dari `getAuthTables(auth.options)`; ubah
 * lewat konfigurasi `packages/auth`, lalu sesuaikan file ini.
 */

export const organizations = snakeCase.table("auth_organizations", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  metadata: text(),
  createdAt: createdAt(),
});

export const members = snakeCase.table(
  "auth_members",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text().default("member").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("auth_members_user_id_idx").on(table.userId),
    // better-auth sudah mengecek keanggotaan ganda; constraint ini menjaga
    // integritas bila dua request menambah anggota yang sama bersamaan.
    uniqueIndex("auth_members_organization_id_user_id_idx").on(
      table.organizationId,
      table.userId
    ),
  ]
);

export const invitations = snakeCase.table(
  "auth_invitations",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    inviterId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    status: text().default("pending").notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("auth_invitations_organization_id_idx").on(table.organizationId),
    index("auth_invitations_email_idx").on(table.email),
  ]
);

export const sessions = snakeCase.table(
  "auth_sessions",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid().references(() => organizations.id, {
      onDelete: "set null",
    }),
    // Plugin admin: admin yang sedang menyamar sebagai pengguna sesi ini.
    impersonatedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("auth_sessions_user_id_idx").on(table.userId)]
);

export const accounts = snakeCase.table(
  "auth_accounts",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    password: text(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("auth_accounts_user_id_idx").on(table.userId)]
);

export const verifications = snakeCase.table(
  "auth_verifications",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)]
);

/** Plugin twoFactor: rahasia TOTP & backup code (terenkripsi), satu baris per pengguna. */
export const twoFactors = snakeCase.table(
  "auth_two_factors",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text().notNull(),
    backupCodes: text().notNull(),
    verified: boolean().default(true).notNull(),
    failedVerificationCount: integer().default(0).notNull(),
    lockedUntil: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("auth_two_factors_user_id_idx").on(table.userId),
    index("auth_two_factors_secret_idx").on(table.secret),
  ]
);

export type Organization = typeof organizations.$inferSelect;
export type Member = typeof members.$inferSelect;
