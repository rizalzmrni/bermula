# STATUS.md — Kondisi Proyek

> Dibaca AI di awal setiap tugas dan diperbarui setelah tugas selesai.
> Isi berdasarkan kondisi nyata repo, bukan rencana.

## Fase berjalan

**Fase 1 — Paket dasar** (`env` & `core` selesai; `observability` sengaja ditunda atas permintaan developer)

## Roadmap

| Fase | Isi                                                                                                     | Status |
| ---- | ------------------------------------------------------------------------------------------------------- | ------ |
| 0    | Root `package.json` + catalog, `turbo.json`, `packages/typescript-config`, Ultracite, Husky, commitlint | ✅     |
| 1    | `packages/env`, `packages/core`, `packages/observability`                                               | 🚧     |
| 2    | `apps/api` (Hono + OpenAPI + Scalar), `packages/db`                                                     | ⏳     |
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
- `packages/env` — skema t3-env: `@bermula/env/api` (`APP_URL`, `WEB_URL`, `CORS_ORIGINS`), `/app` (`VITE_API_URL`), `/web` (`VITE_APP_URL`). File contoh di `apps/api/.dev.vars.example`, `apps/{app,web}/.env.example`.
- Vitest 5 (`catalogs.test`) dipakai `core` dan `env`.
- `apps/*`, `packages/{db,storage,payments}` baru berisi `CLAUDE.md` / file contoh env (belum jadi workspace).

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
- 2026-10-21 — Semua URL di env divalidasi sebagai **origin** (tanpa path/trailing slash). Variabel lain (DB, auth, layanan) ditambahkan di fase masing-masing.
- 2026-10-21 — Impor relatif tanpa ekstensi (`./format`), sesuai `moduleResolution: Bundler`.
- 2026-10-21 — Task turbo `check-types`/`test` bergantung pada `typegen` + transit node `transit` (paralel tapi cache sadar perubahan paket dependensi).

## Hal yang perlu diverifikasi

- `wrangler types` vs `@cloudflare/workers-types` untuk versi terpasang (Fase 2).
- Kompatibilitas TypeScript 7 dengan tool yang memakai JS API TypeScript / peer `typescript@^5` (mis. `@react-router/dev`, Storybook, `drizzle-kit`). Bila bermasalah, opsi: `typescript@^6` di catalog.
- Ekstensi VS Code untuk TS 7: TS 7 tidak menyertakan `tsserver`, sehingga `js/ts.tsdk.path` di `.vscode/settings.json` mungkin tidak berpengaruh.

Sudah terverifikasi (2026-10-21): `ultracite init` menambah blok sendiri ke `AGENTS.md` (tidak menimpa `CLAUDE.md`); blok turbo di `AGENTS.md` dikelola `turbo` (opt-in via `agentGuidance`); `commitlint.config.ts` didukung commitlint 21.

## Utang teknis & temuan

- Preset base tanpa DOM/`types` berarti global Web seperti `URL`/`fetch` tidak tersedia di paket murni; paket yang butuh harus menambah tipe runtime-nya (mis. hasil `wrangler types`) secara eksplisit.
- `.npmrc` kosong sisa create-turbo; boleh dihapus.
- `pre-commit` menjalankan `turbo run check-types --affected` yang membandingkan `main...HEAD`; saat commit langsung di `main` cakupannya bisa kosong, jadi `pre-push`/CI tetap menjalankan check penuh.
