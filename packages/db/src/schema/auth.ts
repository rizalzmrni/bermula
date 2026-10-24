import {
  boolean,
  index,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Tabel milik better-auth (inti + plugin organization). Nama tabel dan nama
 * properti harus sama dengan model/field better-auth, karena adapter
 * `relations-v2` mencarinya lewat kunci di `relations.ts`. Kolom disalin dari
 * `getAuthTables(auth.options)`; ubah lewat konfigurasi `packages/auth`, lalu
 * sesuaikan file ini.
 */

const id = () => uuid().defaultRandom().primaryKey();
const createdAt = () =>
  timestamp({ withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const user = snakeCase.table("user", {
  createdAt: createdAt(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  id: id(),
  image: text(),
  name: text().notNull(),
  updatedAt: updatedAt(),
});

export const organization = snakeCase.table("organization", {
  createdAt: createdAt(),
  id: id(),
  /**
   * Organisasi pribadi dibuat otomatis untuk setiap pengguna (lihat
   * `packages/auth`), tidak bisa dihapus, dan boleh disembunyikan dari UI
   * pada aplikasi yang tidak butuh fitur tim.
   */
  isPersonal: boolean().default(false).notNull(),
  logo: text(),
  metadata: text(),
  name: text().notNull(),
  slug: text().notNull().unique(),
});

export const session = snakeCase.table(
  "session",
  {
    activeOrganizationId: uuid().references(() => organization.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: id(),
    ipAddress: text(),
    token: text().notNull().unique(),
    updatedAt: updatedAt(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = snakeCase.table(
  "account",
  {
    accessToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    accountId: text().notNull(),
    createdAt: createdAt(),
    id: id(),
    idToken: text(),
    password: text(),
    providerId: text().notNull(),
    refreshToken: text(),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    updatedAt: updatedAt(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = snakeCase.table(
  "verification",
  {
    createdAt: createdAt(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: id(),
    identifier: text().notNull(),
    updatedAt: updatedAt(),
    value: text().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const member = snakeCase.table(
  "member",
  {
    createdAt: createdAt(),
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text().default("member").notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("member_user_id_idx").on(table.userId),
    // better-auth sudah mengecek keanggotaan ganda; constraint ini menjaga
    // integritas bila dua request menambah anggota yang sama bersamaan.
    uniqueIndex("member_organization_id_user_id_idx").on(
      table.organizationId,
      table.userId
    ),
  ]
);

export const invitation = snakeCase.table(
  "invitation",
  {
    createdAt: createdAt(),
    email: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: id(),
    inviterId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text(),
    status: text().default("pending").notNull(),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

export type User = typeof user.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
