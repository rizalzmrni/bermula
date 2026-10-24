# STATUS.md — Kondisi Proyek

> Dibaca AI di awal setiap tugas dan diperbarui setelah tugas selesai.
> Isi berdasarkan kondisi nyata repo, bukan rencana.

## Fase berjalan

**Fase 2–3 — sebagian** (`packages/db`, `packages/auth`, dan `apps/api` selesai serta teruji end-to-end di Neon dev; tersisa auth gate di `apps/app`).
Arahan developer (2026-10-21): siapkan **semua `packages/*` lebih dulu**, baru
kemudian `apps/*`. Pengecualian (2026-10-24): `apps/api` dibuat lebih dulu
sebelum `packages/storage`.

## Roadmap

| Fase | Isi                                                                                                     | Status |
| ---- | ------------------------------------------------------------------------------------------------------- | ------ |
| 0    | Root `package.json` + catalog, `turbo.json`, `packages/typescript-config`, Ultracite, Husky, commitlint | ✅     |
| 1    | `packages/env`, `packages/core`, `packages/observability`                                               | ✅     |
| 2    | `apps/api` (Hono + OpenAPI + Scalar), `packages/db`                                                     | ✅     |
| 3    | `packages/auth` + better-auth di api, auth gate di `apps/app`                                           | 🚧     |
| 4    | `packages/design-system`, `apps/storybook`, `apps/app`, `apps/web`                                      | ⏳     |
| 5    | `packages/email` + `apps/email`, `packages/storage`                                                     | 🚧     |
| 6    | `packages/payments` (Stripe + webhook), `packages/analytics`, `packages/seo`                            | ⏳     |
| 7    | CI/CD dan deploy                                                                                        | ⏳     |

Status: ⏳ belum · 🚧 sedang · ✅ selesai

## Paket & app yang sudah ada

- `packages/typescript-config` — preset `base.json` (Worker/paket murni/tooling) dan `react.json` (app React Router & paket React). Lihat README-nya.
- Root tooling: turbo 2.11, Ultracite 8 (Oxlint + Oxfmt), Husky (`pre-commit`, `commit-msg`, `pre-push`), lint-staged, commitlint (`commitlint.config.ts`).
- `packages/core` — `@bermula/core/brand` (`APP_NAME`, dipakai email & issuer TOTP), `@bermula/core/format`: `formatNumber`, `formatCurrency`, `formatDate`, `formatRelativeTime` (default `id-ID`, IDR, `Asia/Jakarta`). Belum ada `src/schemas` (dibuat saat fitur pertama).
- `packages/env` — skema t3-env: `@bermula/env/api` (`APP_URL`, `WEB_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `LOG_LEVEL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AUTH_COOKIE_DOMAIN` opsional, pasangan opsional BetterStack, PostHog & Google OAuth), `/app` (`VITE_API_URL`), `/web` (`VITE_APP_URL`). File contoh di `apps/api/.dev.vars.example`, `apps/{app,web}/.env.example`.
- `packages/observability` — `logger` (JSON ke console/Workers Logs + buffer + `flush`), `better-stack` (transport HTTP), `posthog` (`$exception` ke PostHog Error Tracking). Tanpa dependensi runtime.
- `packages/db` — Drizzle v1 RC + Neon: `createDb` (neon-http), `createTxDb` (Pool per request + `close`), `relations.ts`, helper kolom `columns.ts`, `drizzle.config.ts`, skrip `db:generate|migrate|studio`. Tabel: `@bermula/db/schema/users` (`auth_users`, termasuk kolom plugin admin & twoFactor) dan `@bermula/db/schema/auth` (7 tabel `auth_*` lain, termasuk `auth_two_factors` dan `auth_organizations.is_personal`), migrasi `migrations/20261024123551_auth` (diterapkan ke branch Neon dev 2026-10-24; belum ke produksi).
- `packages/auth` — better-auth 1.7: `@bermula/auth/server` (`createAuth` per request: email+password wajib verifikasi, Google opsional, plugin admin, organization + organisasi pribadi otomatis, twoFactor (TOTP + backup code), email via `waitUntil`), `@bermula/auth/client` (klien vanilla + `adminClient`, `organizationClient`, `twoFactorClient`).
- `packages/email` — React Email 1.0 + Resend 6: template `verify-email`, `reset-password`, `organization-invitation` (bahasa Indonesia, gaya inline dari token DESIGN.md dalam hex di `src/brand.ts`), `createEmailSender` (HTML + teks polos, bentuk cocok dengan `AuthEmailSenders`), `createResendTransport`. Env `RESEND_API_KEY` + `EMAIL_FROM` (wajib) di `@bermula/env/api`. `apps/email` (server preview) belum dibuat.
- `apps/api` — Hono 4.13 + `@hono/zod-openapi` 1.6 + Scalar di Workers (`nodejs_compat`). Middleware per request (env, logger, db, auth, PostHog), CORS dari `CORS_ORIGINS`, rate limit binding (`AUTH_RATE_LIMIT` 10/60 dtk, `API_RATE_LIMIT` 100/60 dtk per IP), `requireAuth` (sesi + organisasi aktif), error seragam (`onError`, `defaultHook`, 404). Endpoint: `GET /health`, `GET|POST /api/auth/*`, `GET /api/me`; `/openapi.json` + `/docs` bila `API_DOCS_ENABLED=true`. Ekspor `AppType`. Lihat README-nya.
- `packages/storage` — antarmuka `ObjectStorage`, `createR2Storage` (binding R2: put/get/head/delete), `createR2Presigner` (aws4fetch 1.0.20, presigned PUT/GET ≤15 menit, `content-type` & `content-length` ikut ditandatangani), `createObjectKey` (`uploads/<organization_id>/<uuid>-<nama-aman>`), `validateUpload`. Belum dipasang di `apps/api` (binding `BUCKET`, env `R2_*`) dan belum ada tabel metadata file; keduanya menyusul bersama fitur upload pertama.
- Vitest 5 (`catalogs.test`) dipakai `core`, `env`, `observability`, `auth`, `email`, `api`, `storage` (workerd via `@cloudflare/vitest-plugin`).
- `apps/{app,web,email,storybook}`, `packages/payments` baru berisi `CLAUDE.md` / file contoh env (belum jadi workspace).

## Keputusan tertunda

Bila tugas menyentuh salah satunya: berhenti dan tanyakan.

| Topik           | Opsi | Batas waktu                     |
| --------------- | ---- | ------------------------------- |
| Domain produksi | —    | Sebelum deploy pertama (Fase 7) |

## Keputusan yang sudah diambil

- 2026-10-21 — TypeScript 7 (native) di `catalog` default; preset `module: Preserve` + `moduleResolution: Bundler` + `noEmit` karena semua kode di-bundle Vite/wrangler.
- 2026-10-21 — `types: []` di preset base; tiap workspace menambah tipe globalnya sendiri agar tipe Node/Bun tidak bocor ke kode Worker.
- 2026-10-21 — `erasableSyntaxOnly` menegakkan aturan "tanpa `enum`" di level compiler.
- 2026-10-21 — Oxfmt: override `proseWrap: "preserve"` (Markdown tetap di-wrap manual ±80 kolom) dan abaikan `.agents/skills`, `.claude/skills` (skill pihak ketiga ber-hash).
- 2026-10-21 — Env server berbentuk factory (`createApiEnv(c.env)`, dipanggil per request) karena env Workers baru ada saat request; env klien lewat getter yang membaca `import.meta.env` di dalam `packages/env`.
- 2026-10-21 — Semua URL di env divalidasi sebagai **origin** (tanpa path/trailing slash). Variabel lain (auth, layanan) ditambahkan di fase masing-masing.
- 2026-10-21 — Impor relatif tanpa ekstensi (`./format`), sesuai `moduleResolution: Bundler`.
- 2026-10-21 — Task turbo `check-types`/`test` bergantung pada `typegen` + transit node `transit` (paralel tapi cache sadar perubahan paket dependensi).
- 2026-10-21 — **Sentry diganti PostHog Error Tracking** (akun Sentry hanya trial). Server: `$exception` lewat HTTP capture API + `fetch`; browser: `posthog-js` (Fase 6, `packages/analytics`). `@sentry/*` dihapus dari catalog `services`.
- 2026-10-21 — Integrasi observability opsional di env, tetapi berpasangan (token + host wajib diisi bersama).
- 2026-10-21 — `no-console` diaktifkan kembali (Ultracite mematikannya); hanya `packages/observability/src/logger.ts` (+ test-nya) yang dikecualikan.
- 2026-10-21 — `packages/observability` memakai lib `WebWorker` (tanpa DOM) agar hanya API yang ada di Workers & browser yang lolos type-check.
- 2026-10-21 — **Drizzle v1 RC** (`drizzle-orm` & `drizzle-kit` `1.0.0-rc.4`, dist-tag `rc`), dipin persis karena prerelease: caret akan ikut menarik build preview `rc.5-<hash>`. Casing lewat `snakeCase.table(...)`; relasi lewat `defineRelations`.
- 2026-10-21 — `@types/node` di catalog mengikuti Node 24 (`engines`), bukan versi terbaru (26).
- 2026-10-21 — **Scoping data: per-organisasi** (plugin organization better-auth). Tabel data pengguna memakai `organization_id`; service menerima `organizationId` dari sesi aktif.
- 2026-10-21 — Metode login: email + password (wajib verifikasi) dan Google OAuth (opsional lewat env).
- 2026-10-21 — Adapter `@better-auth/drizzle-adapter/relations-v2` (RQB v2 Drizzle v1) dengan `createDb` (neon-http), `transaction: false`. Jalur transaksi wajib di adapter hanya untuk MySQL. Konsekuensi: operasi multi-langkah better-auth tidak atomik.
- 2026-10-21 — Rate limiter bawaan better-auth dimatikan (memori per isolate); `/api/auth/*` dibatasi binding Rate Limiting di apps/api.
- 2026-10-21 — `packages/auth` tidak bergantung pada `packages/email`: fungsi kirim disuntikkan oleh apps/api lewat `createAuth({ emails })`.
- 2026-10-24 — **Organisasi pribadi otomatis** (opsi A): setiap pengguna punya satu organisasi `is_personal`, dibuat di `session.create.before` (sesi pertama) lewat `db.batch` (atomik di neon-http), lalu `activeOrganizationId` = organisasi pertama pengguna. Tidak bisa dihapus. Aplikasi tanpa fitur tim cukup menyembunyikan UI organisasi.
- 2026-10-24 — **Plugin admin + twoFactor (TOTP + backup code)** aktif; ID tetap `uuid`. Kolom & tabel dicocokkan dengan output CLI resmi (`bunx auth@1.7.12 generate`): set kolom identik, `auth_two_factors` ditambah `created_at`/`updated_at`. Hook `session.create.before` kini mempertahankan `activeOrganizationId` yang sudah dibawa sesi pengganti (aktivasi 2FA, impersonate).
- 2026-10-24 — **Konvensi tabel:** nama `<kelompok>_<jamak>` (`auth_users`, `auth_organizations`); urutan kolom menurut prioritas (`id` → data → FK → opsional → `created_at`/`updated_at`), sehingga `sort-keys` dimatikan untuk `packages/db/src/schema/**`. Adapter better-auth memakai `usePlural: true`. `auth_users` di file sendiri (`schema/users.ts`) karena akan berkembang.
- 2026-10-24 — Skema auth ditulis manual dengan `snakeCase.table` (kolom dari `getAuthTables(auth.options)`), bukan CLI better-auth, agar sesuai konvensi `packages/db`; diverifikasi dengan schema check adapter. Timestamp `timestamptz`, ID `uuid` default `gen_random_uuid()`, FK `auth_sessions.active_organization_id` (`set null`), unik `(organization_id, user_id)` di `auth_members`.
- 2026-10-24 — `packages/email`: email dirender sendiri (`render` + `toPlainText`), bukan opsi `react` SDK Resend, lalu dikirim lewat `EmailTransport` yang bisa diganti (Resend hanya satu implementasi). Gaya inline, bukan komponen `Tailwind` React Email (compiler Tailwind berat untuk bundle Worker dan token berbasis CSS variable tidak didukung klien email).
- 2026-10-24 — `RESEND_API_KEY` & `EMAIL_FROM` wajib (tanpa mode "log ke console") agar URL verifikasi/reset tidak pernah tercetak ke log bila env produksi salah konfigurasi.
- 2026-10-24 — **`@cloudflare/vitest-plugin`** (1.4) menggantikan `@cloudflare/vitest-pool-workers` (deprecated, hanya Vitest ^4.1); mendukung Vitest 5. Konfigurasi lewat plugin Vite `cloudflareTest()`, akses lewat `cloudflare:workers`.
- 2026-10-24 — `apps/api` memakai `nodejs_compat` (better-auth memuat `AsyncLocalStorage` dari `node:async_hooks`). Bundle produksi ±4,9 MB / 911 KB gzip (`wrangler deploy --dry-run`), di bawah batas 3 MB paket gratis.
- 2026-10-24 — `/docs` & `/openapi.json` dikendalikan `API_DOCS_ENABLED` (default `false`, `true` di `.dev.vars.example`); dimatikan → 404 seragam.
- 2026-10-24 — Rate limit: `/api/auth/*` 10 req/60 dtk, `/api/*` lain 100 req/60 dtk, kunci `cf-connecting-ip`; melebihi → 429 `RATE_LIMITED`.
- 2026-10-24 — `packages/storage` memakai tipe global `R2Bucket` dari `wrangler types`; paket punya `wrangler.jsonc` khusus typegen/test (bukan Worker). Semua test storage berjalan di workerd.
- 2026-10-21 — `drizzle.config.ts` membaca `.env` dengan `process.loadEnvFile()` bawaan Node (tanpa `dotenv`), type-check terpisah lewat `tsconfig.node.json`.

## Hal yang perlu diverifikasi

- Presigned URL `packages/storage` baru diuji secara deterministik (format & parameter SigV4), belum terhadap bucket R2 nyata; khususnya penegakan `content-length` yang ditandatangani. Uji saat token S3 API R2 tersedia.
- Kompatibilitas TypeScript 7 dengan tool yang memakai JS API TypeScript / peer `typescript@^5` (mis. `@react-router/dev`, Storybook). Bila bermasalah, opsi: `typescript@^6` di catalog.
- Ekstensi VS Code untuk TS 7: TS 7 tidak menyertakan `tsserver`, sehingga `js/ts.tsdk.path` di `.vscode/settings.json` mungkin tidak berpengaruh.

Sudah terverifikasi (2026-10-24, branch Neon dev): migrasi auth, `createDb` & `createTxDb` (transaksi), organisasi pribadi dibuat sekali/idempoten/aman untuk login bersamaan, default kolom plugin admin & 2FA. Alur HTTP end-to-end via `wrangler dev` (2026-10-24): sign-up → login ditolak sebelum verifikasi (403) → login → `/api/me` 200 dengan organisasi pribadi (owner), satu organisasi saja setelah beberapa request, origin asing ditolak (403), `/docs` & OpenAPI 3.1 tampil. `wrangler types` cukup (tanpa `@cloudflare/workers-types`).

Sudah terverifikasi (2026-10-21): `ultracite init` menambah blok sendiri ke `AGENTS.md` (tidak menimpa `CLAUDE.md`); blok turbo di `AGENTS.md` dikelola `turbo` (opt-in via `agentGuidance`); `commitlint.config.ts` didukung commitlint 21; format BetterStack HTTP ingest & PostHog `$exception` dicek dari dokumentasi resmi.

## Utang teknis & temuan

- Preset base tanpa DOM/`types` berarti global Web seperti `URL`/`fetch` tidak tersedia di paket murni; paket yang butuh harus menambah lib/tipe runtime-nya secara eksplisit.
- `db:generate` mewajibkan `DATABASE_URL` terisi walau tidak menyambung ke DB (validasi di `drizzle.config.ts`).
- Frame stack PostHog dari server berupa lokasi bundle; source map belum di-upload ke PostHog.
- `.npmrc` kosong sisa create-turbo; boleh dihapus.
- Endpoint better-auth (`/api/auth/*`) belum masuk dokumen OpenAPI; opsi: plugin `openAPI` better-auth atau tautan ke referensinya.
- `getActiveMembership` (`apps/api/src/services/account.ts`) baru teruji lewat e2e manual; belum ada test otomatis berbasis DB.
- `pre-commit` menjalankan `turbo run check-types --affected` yang membandingkan `main...HEAD`; saat commit langsung di `main` cakupannya bisa kosong, jadi `pre-push`/CI tetap menjalankan check penuh.
