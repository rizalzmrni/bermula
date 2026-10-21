# packages/db — Drizzle + Neon

Aturan root `CLAUDE.md` tetap berlaku.

## Driver

- Query biasa dari Workers: `drizzle-orm/neon-http` + `@neondatabase/serverless`.
  Workers tidak mendukung koneksi TCP Postgres biasa secara langsung.
- `neon-http` **tidak mendukung transaksi interaktif**. Bila butuh transaksi
  (mis. update langganan + catat event), pakai `drizzle-orm/neon-serverless`
  dengan `Pool` yang dibuat dan ditutup **per request** (jangan disimpan di
  variabel modul).
- Ekspor dua factory terpisah, mis. `createDb(env)` dan `createTxDb(env)`, agar
  pemanggil memilih secara sadar.
- Bila library (mis. adapter better-auth) membutuhkan transaksi, cek
  dokumentasinya dan laporkan opsi; jangan menebak.
- Alternatif yang belum dipakai: Cloudflare Hyperdrive. Usulkan dulu bila
  latensi/koneksi menjadi masalah.

## Skema & migrasi

- Skema adalah sumber kebenaran struktur data; tipe diturunkan dengan
  `$inferSelect` / `$inferInsert`.
- Versi: Drizzle **v1 release candidate** (`drizzle-orm` & `drizzle-kit`
  dipin persis di catalog `db`). API v1 berbeda dari 0.x; cek tipe di
  `node_modules` dan skill bawaan `drizzle-kit/skills`, jangan dari ingatan.
- `snake_case` di Postgres, `camelCase` di kode: definisikan tabel dengan
  `snakeCase.table(...)` dari `drizzle-orm/pg-core` (v1 tidak lagi punya opsi
  `casing` di `drizzle()`).
- Satu file skema per domain di `src/schema/<domain>.ts`; relasi didaftarkan di
  `src/relations.ts` dengan `defineRelations` (relational query v2).
- Perubahan skema → `bun run db:generate` (drizzle-kit generate), lalu commit
  file migrasi. **Jangan** `drizzle-kit push` ke database produksi.
- **Jangan** menjalankan migrasi ke produksi tanpa izin eksplisit.
- Perubahan skema = tugas **berisiko**: tulis rencana dan tunggu persetujuan.

## Scoping data

- **Keputusan tertunda** (lihat `STATUS.md`): per-user (`user_id`) atau
  per-organisasi (`organization_id`). Sebelum membuat tabel data pengguna
  pertama, **berhenti dan tanyakan** jika belum diputuskan.
- Setelah diputuskan: setiap tabel data pengguna punya kolom scoping tersebut,
  dan setiap query di service membatasi hasil dengan nilai dari sesi aktif.
- Index untuk kolom scoping, timestamp, dan kolom yang sering difilter/diurut.

## Env & tooling

- `drizzle.config.ts` berjalan di Node (CLI), membaca env dari `.env`
  (contoh di `packages/db/.env.example`). Ini satu-satunya tempat paket ini
  boleh membaca `process.env` langsung.
- Kode runtime menerima `DATABASE_URL` sebagai parameter dari binding, tidak
  membaca env sendiri.

## Seed & test

- Seed di `src/seed.ts`, hanya untuk database lokal/dev.
- Test tidak menyentuh database produksi; pakai database lokal/branch Neon dev
  atau stub di level service.
