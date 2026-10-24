# @bermula/db

Drizzle ORM **v1 RC** + Neon. Aturan lengkap: `CLAUDE.md` di folder ini.

| Export                        | Pakai untuk                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `createDb({ databaseUrl })`   | Query biasa lewat HTTP (`neon-http`). Tanpa transaksi interaktif.                |
| `createTxDb({ databaseUrl })` | Transaksi (`neon-serverless` Pool). Buat per request, lalu `waitUntil(close())`. |
| `@bermula/db/schema/<domain>` | Tabel Drizzle per domain, mis. `schema/auth` (tabel better-auth).                |

## Perintah

```bash
cp packages/db/.env.example packages/db/.env   # isi DATABASE_URL (branch Neon dev)
bun run db:generate   # buat file migrasi dari src/schema/*
bun run db:migrate    # terapkan migrasi (jangan ke produksi tanpa izin)
bun run db:studio
```

Migrasi tersimpan di `migrations/` (hasil `drizzle-kit`, tidak diformat
Oxfmt). `db:generate` tidak menyambung ke database, tetapi
`drizzle.config.ts` tetap mewajibkan `DATABASE_URL` terisi.

## Tabel auth

`src/schema/auth.ts` berisi tabel better-auth (`user`, `session`, `account`,
`verification`, `organization`, `member`, `invitation`). Nama tabel & properti
wajib sama dengan model better-auth. Bila konfigurasi `packages/auth` berubah
(plugin/field baru), sesuaikan file ini lalu `db:generate`.
