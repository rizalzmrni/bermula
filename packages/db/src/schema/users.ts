import { boolean, snakeCase, text } from "drizzle-orm/pg-core";

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
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
