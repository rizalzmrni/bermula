import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { QueryDb } from "./client";
import { relations } from "./relations";

// Hanya untuk test di Node (Vitest), bukan kode Worker: PGlite memuat Postgres
// WASM dan migrator membaca folder migrasi dari disk.
const MIGRATIONS_FOLDER = path.join(import.meta.dirname, "..", "migrations");

/**
 * Postgres asli di memori (PGlite) dengan migrasi yang sama dengan produksi.
 * Tanpa jaringan, sehingga test service berbasis DB tetap deterministik.
 * Buat satu per file test dan panggil `close()` di `afterAll`.
 */
export const createTestDb = async () => {
  const client = new PGlite();
  const db = drizzle({ client, relations });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  const queryDb: QueryDb = db;
  return { close: () => client.close(), db: queryDb };
};
