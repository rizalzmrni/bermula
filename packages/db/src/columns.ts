import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Kolom bersama semua tabel. Letakkan `id` paling atas dan timestamp paling bawah. */
export const id = () => uuid().defaultRandom().primaryKey();

export const createdAt = () =>
  timestamp({ withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();
