import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePool } from "drizzle-orm/neon-serverless";
import type { PgAsyncDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { relations } from "./relations";

export interface DbOptions {
  /** Dari binding Worker (`c.env.DATABASE_URL`), bukan dari env modul. */
  databaseUrl: string;
}

/**
 * Klien untuk query biasa lewat HTTP. Tanpa koneksi yang perlu ditutup, jadi
 * aman dibuat per request. Tidak mendukung transaksi interaktif.
 */
export const createDb = ({ databaseUrl }: DbOptions) =>
  drizzleHttp({ client: neon(databaseUrl), relations });

export type Db = ReturnType<typeof createDb>;

/**
 * Basis bersama driver Postgres Drizzle (neon-http di produksi, PGlite di
 * test). Service yang cukup dengan query builder menerima tipe ini agar bisa
 * diuji dengan `createTestDb` dari `@bermula/db/testing`; pakai `Db` bila butuh
 * fitur khusus neon-http seperti `batch`.
 */
export type QueryDb = PgAsyncDatabase<PgQueryResultHKT, typeof relations>;

/**
 * Klien WebSocket (`Pool`) untuk transaksi interaktif. Pool tidak boleh dipakai
 * lintas request di Workers, jadi buat per request dan panggil `close()` setelah
 * selesai, mis. `c.executionCtx.waitUntil(close())`.
 */
export const createTxDb = ({ databaseUrl }: DbOptions) => {
  const pool = new Pool({ connectionString: databaseUrl });

  return {
    close: () => pool.end(),
    db: drizzlePool({ client: pool, relations }),
  };
};

export type TxDb = ReturnType<typeof createTxDb>["db"];
