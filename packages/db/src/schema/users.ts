import { boolean, snakeCase, text, timestamp } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "../columns";

/**
 * Pengguna (model `user` better-auth). Dipisah dari `auth.ts` karena akan
 * berkembang (profil, preferensi). Kolom tambahan juga harus didaftarkan di
 * `user.additionalFields` konfigurasi `packages/auth` agar dikenali better-auth.
 */
export const users = snakeCase.table("auth_users", {
  id: id(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  // Plugin admin: role level aplikasi (bukan role di organisasi) & status ban.
  role: text().default("user").notNull(),
  banned: boolean().default(false).notNull(),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  // Plugin twoFactor.
  twoFactorEnabled: boolean().default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
