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
  `src/relations.ts` dengan `defineRelations` (relational query v2). Tabel yang
  akan berkembang sendiri boleh punya file sendiri (mis. `schema/users.ts`).
- **Nama tabel:** `<kelompok>_<jamak>` dalam `snake_case`, mis. `auth_users`,
  `auth_organizations`, `billing_subscriptions`. Nama ekspor TypeScript cukup
  bentuk jamaknya (`users`, `organizations`).
- **Urutan kolom = urutan properti** (aturan `sort-keys` dimatikan untuk
  `src/schema/**`): `id` → kolom data utama → foreign key/scoping → kolom
  opsional → `createdAt`, `updatedAt` paling bawah. Helper `id()`,
  `createdAt()`, `updatedAt()` ada di `src/columns.ts`.
- Perubahan skema → `bun run db:generate` (drizzle-kit generate), lalu commit
  file migrasi. **Jangan** `drizzle-kit push` ke database produksi.
- **Jangan** menjalankan migrasi ke produksi tanpa izin eksplisit.
- Perubahan skema = tugas **berisiko**: tulis rencana dan tunggu persetujuan.

## Scoping data

- **Dua konteks** (diputuskan 2026-10-28, menggantikan scoping dari sesi aktif
  2026-10-21; diterapkan bertahap di fase B/C
  `docs/user-organization-dashboards.md`):
  - Data organisasi punya kolom `organization_id` (FK ke
    `auth_organizations.id`). Service menerima `organizationId` yang diambil
    dari path URL dan sudah dicek keanggotaannya oleh middleware
    `requireOrganizationMember`, bukan dari `activeOrganizationId` sesi.
  - Data pribadi punya kolom `user_id` (FK ke `auth_users.id`). Service
    menerima `userId` dari sesi.
  - Tidak ada organisasi pribadi otomatis; pengguna bisa punya nol organisasi.
- Tabel milik better-auth (`auth_users`, `auth_sessions`, `auth_accounts`,
  `auth_verifications`, `auth_organizations`, `auth_members`,
  `auth_invitations`) mengikuti field better-auth (adapter `usePlural: true`),
  bukan aturan scoping ini.
- Index untuk kolom scoping, timestamp, dan kolom yang sering difilter/diurut.

## Env & tooling

- `drizzle.config.ts` berjalan di Node (CLI), membaca env dari `.env`
  (contoh di `packages/db/.env.example`). Ini satu-satunya tempat paket ini
  boleh membaca `process.env` langsung.
- Kode runtime menerima `DATABASE_URL` sebagai parameter dari binding, tidak
  membaca env sendiri.

## Seed & test

- Seed di `src/seed.ts`, hanya untuk database lokal/dev.
- Test tidak menyentuh database produksi. Service berbasis DB diuji dengan
  `createTestDb()` dari `@bermula/db/testing`: PGlite (Postgres WASM di memori)
  dengan migrasi dari `migrations/`, tanpa jaringan. Hanya untuk test di Node;
  file ini di-type-check lewat `tsconfig.node.json`.
- Service yang ingin diuji dengan PGlite menerima `QueryDb` (basis bersama
  driver), bukan `Db`. `Db` (neon-http) tetap dipakai bila butuh `batch`.
