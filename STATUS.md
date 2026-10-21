# STATUS.md — Kondisi Proyek

> Dibaca AI di awal setiap tugas dan diperbarui setelah tugas selesai.
> Isi berdasarkan kondisi nyata repo, bukan rencana.

## Fase berjalan

**Fase 2 — sebagian** (`packages/db` selesai; `apps/api` sengaja ditunda).
Arahan developer (2026-10-21): siapkan **semua `packages/*` lebih dulu**, baru
kemudian `apps/*`.

## Roadmap

| Fase | Isi                                                                                                     | Status |
| ---- | ------------------------------------------------------------------------------------------------------- | ------ |
| 0    | Root `package.json` + catalog, `turbo.json`, `packages/typescript-config`, Ultracite, Husky, commitlint | ✅     |
| 1    | `packages/env`, `packages/core`, `packages/observability`                                               | ✅     |
| 2    | `apps/api` (Hono + OpenAPI + Scalar), `packages/db`                                                     | 🚧     |
| 3    | `packages/auth` + better-auth di api, auth gate di `apps/app`                                           | ⏳     |
| 4    | `packages/design-system`, `apps/storybook`, `apps/app`, `apps/web`                                      | ⏳     |
| 5    | `packages/email` + `apps/email`, `packages/storage`                                                     | ⏳     |
| 6    | `packages/payments` (Stripe + webhook), `packages/analytics`, `packages/seo`                            | ⏳     |
| 7    | CI/CD dan deploy                                                                                        | ⏳     |

Status: ⏳ belum · 🚧 sedang · ✅ selesai

## Paket & app yang sudah ada

- `packages/typescript-config` — preset `base.json` (Worker/paket murni/tooling) dan `react.json` (app React Router & paket React). Lihat README-nya.
- Root tooling: turbo 2.11, Ultracite 8 (Oxlint + Oxfmt), Husky (`pre-commit`, `commit-msg`, `pre-push`), lint-staged, commitlint (`commitlint.config.ts`).
- `packages/core` — `@bermula/core/format`: `formatNumber`, `formatCurrency`, `formatDate`, `formatRelativeTime` (default `id-ID`, IDR, `Asia/Jakarta`). Belum ada `src/schemas` (dibuat saat fitur pertama).
- `packages/env` — skema t3-env: `@bermula/env/api` (`APP_URL`, `WEB_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `LOG_LEVEL`, pasangan opsional BetterStack & PostHog), `/app` (`VITE_API_URL`), `/web` (`VITE_APP_URL`). File contoh di `apps/api/.dev.vars.example`, `apps/{app,web}/.env.example`.
- `packages/observability` — `logger` (JSON ke console/Workers Logs + buffer + `flush`), `better-stack` (transport HTTP), `posthog` (`$exception` ke PostHog Error Tracking). Tanpa dependensi runtime.
- `packages/db` — Drizzle v1 RC + Neon: `createDb` (neon-http), `createTxDb` (Pool per request + `close`), `relations.ts` (masih kosong), `drizzle.config.ts`, skrip `db:generate|migrate|studio`. **Belum ada tabel.**
- Vitest 5 (`catalogs.test`) dipakai `core`, `env`, `observability`.
- `apps/*`, `packages/{storage,payments}` baru berisi `CLAUDE.md` / file contoh env (belum jadi workspace).

## Keputusan tertunda

Bila tugas menyentuh salah satunya: berhenti dan tanyakan.

| Topik           | Opsi                                                                                        | Batas waktu                         |
| --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| Scoping data    | per-user (`user_id`) / per-organisasi (`organization_id` + plugin organization better-auth) | Sebelum tabel data pengguna pertama |
| Domain produksi | —                                                                                           | Sebelum deploy pertama (Fase 7)     |

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
- 2026-10-21 — `drizzle.config.ts` membaca `.env` dengan `process.loadEnvFile()` bawaan Node (tanpa `dotenv`), type-check terpisah lewat `tsconfig.node.json`.

## Hal yang perlu diverifikasi

- `wrangler types` vs `@cloudflare/workers-types` untuk versi terpasang (saat `apps/api` dibuat).
- Kompatibilitas TypeScript 7 dengan tool yang memakai JS API TypeScript / peer `typescript@^5` (mis. `@react-router/dev`, Storybook). Bila bermasalah, opsi: `typescript@^6` di catalog.
- Ekstensi VS Code untuk TS 7: TS 7 tidak menyertakan `tsserver`, sehingga `js/ts.tsdk.path` di `.vscode/settings.json` mungkin tidak berpengaruh.
- Kompatibilitas adapter Drizzle better-auth dengan Drizzle v1 RC (Fase 3) — cek dokumentasinya sebelum memilih adapter.
- `createDb`/`createTxDb` belum diuji ke database nyata (belum ada tabel/branch Neon dev).

Sudah terverifikasi (2026-10-21): `ultracite init` menambah blok sendiri ke `AGENTS.md` (tidak menimpa `CLAUDE.md`); blok turbo di `AGENTS.md` dikelola `turbo` (opt-in via `agentGuidance`); `commitlint.config.ts` didukung commitlint 21; format BetterStack HTTP ingest & PostHog `$exception` dicek dari dokumentasi resmi.

## Utang teknis & temuan

- Preset base tanpa DOM/`types` berarti global Web seperti `URL`/`fetch` tidak tersedia di paket murni; paket yang butuh harus menambah lib/tipe runtime-nya secara eksplisit.
- `db:generate` gagal (`schema_files_not_found_error`) sampai file pertama ada di `packages/db/src/schema/`.
- Frame stack PostHog dari server berupa lokasi bundle; source map belum di-upload ke PostHog.
- `.npmrc` kosong sisa create-turbo; boleh dihapus.
- `pre-commit` menjalankan `turbo run check-types --affected` yang membandingkan `main...HEAD`; saat commit langsung di `main` cakupannya bisa kosong, jadi `pre-push`/CI tetap menjalankan check penuh.
