# @bermula/db

Drizzle ORM **v1 RC** + Neon. Aturan lengkap: `CLAUDE.md` di folder ini.

| Export                        | Pakai untuk                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `createDb({ databaseUrl })`   | Query biasa lewat HTTP (`neon-http`). Tanpa transaksi interaktif.                |
| `createTxDb({ databaseUrl })` | Transaksi (`neon-serverless` Pool). Buat per request, lalu `waitUntil(close())`. |

## Perintah

```bash
cp packages/db/.env.example packages/db/.env   # isi DATABASE_URL (branch Neon dev)
bun run db:generate   # buat file migrasi dari src/schema/*
bun run db:migrate    # terapkan migrasi (jangan ke produksi tanpa izin)
bun run db:studio
```

`db:generate` baru berfungsi setelah file skema pertama ada di `src/schema/`
(saat ini belum ada tabel; menunggu keputusan scoping data di `STATUS.md`).
