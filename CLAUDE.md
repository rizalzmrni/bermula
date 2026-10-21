# CLAUDE.md — Instruksi Pengembangan Boilerplate SaaS

> Aturan umum proyek yang berlaku di setiap sesi. Tugas dan detail fitur
> diberikan developer lewat chat. Jika permintaan di chat berbeda dengan dokumen
> ini, ikuti developer, kecuali menyangkut keamanan: sebutkan risikonya dan minta
> konfirmasi dulu. Jika dua aturan bertentangan, **Prioritas Aturan** yang menang.

## Peta Dokumen

Dokumen ini hanya memuat aturan lintas-proyek. Aturan spesifik ada di dekat
kodenya. `CLAUDE.md` di subfolder dimuat otomatis saat Claude membaca file di
folder tersebut; file di `docs/` **tidak** dimuat otomatis, jadi baca saat
diperlukan:

| File                                       | Isi                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `apps/api/CLAUDE.md`                       | Hono, kontrak API, OpenAPI/Scalar, error, rate limit, logging                           |
| `apps/app/CLAUDE.md`, `apps/web/CLAUDE.md` | React Router di Workers (keduanya mengimpor `docs/react-router.md`)                     |
| `packages/db/CLAUDE.md`                    | Drizzle, Neon, migrasi, scoping data                                                    |
| `packages/storage/CLAUDE.md`               | Cloudflare R2, presigned URL                                                            |
| `packages/payments/CLAUDE.md`              | Stripe & webhook                                                                        |
| `docs/dependencies.md`                     | bun catalog lengkap — **baca sebelum menambah/upgrade dependensi**                      |
| `docs/git.md`                              | Detail branch, commit, hook — **baca sebelum commit pertama di sesi**                   |
| `STATUS.md`                                | Paket yang sudah ada, fase berjalan, keputusan tertunda — **baca di awal setiap tugas** |
| `DESIGN.md`                                | Token & aturan UI — **baca sebelum tugas UI**                                           |

@AGENTS.md

## Tujuan & Konteks

Membangun **boilerplate SaaS produksi** (monorepo) sebagai pondasi live project:
auth, database, pembayaran, email, storage, analitik, observability, dan
dokumentasi API yang tertata. Kode harus type-safe, bersih, teruji, dan mudah
dipelihara oleh satu developer tingkat menengah — contoh pola yang baik, bukan
sekadar "jalan".

- **Deployment:** Cloudflare Workers (runtime `workerd`, bukan Node.js) untuk
  `web`, `app`, dan `api`.
- **Audiens:** developer tingkat menengah. Jelaskan keputusan dengan bahasa lugas.
- **Prinsip:** Cepat, Opinionated, Type-safe end-to-end, Modern, Aman.
- **Sifat fondasi:** fitur bisa ditambah tanpa mengubah fitur lain
  (feature-first); setiap teknologi bisa diganti dengan friksi minimal.

**Peran:** senior full-stack TypeScript engineer yang ahli Cloudflare Workers,
React Router (framework mode), Hono, dan Drizzle.

## Prioritas Aturan

1. Keamanan (auth, otorisasi, secret, penanganan input).
2. Aturan lint/format Ultracite (dijalankan otomatis oleh hook dan CI).
3. Aturan lain di dokumen ini dan dokumen turunannya.
4. Preferensi gaya pribadi AI.

---

## Kebijakan Teknologi

Satu bahasa (TypeScript) agar tipe dan logika dibagikan antar-paket; satu runtime
(Workers) agar deployment seragam.

| Area               | Pilihan                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Bahasa             | TypeScript `strict: true`                                                                    |
| Monorepo / PM      | Turborepo + bun workspaces (bun satu-satunya package manager)                                |
| Frontend           | React + React Router (framework mode, SSR) + Vite + `@cloudflare/vite-plugin`                |
| Backend            | Hono + `@hono/zod-openapi` + Scalar                                                          |
| Database           | Neon Postgres + Drizzle (lihat `packages/db/CLAUDE.md` untuk driver)                         |
| Validasi / Env     | Zod / t3-env (`@t3-oss/env-core`)                                                            |
| UI                 | Tailwind CSS + shadcn/ui                                                                     |
| Auth               | better-auth                                                                                  |
| Pembayaran / Email | Stripe / Resend + React Email                                                                |
| Storage            | Cloudflare R2 (dibungkus `packages/storage`)                                                 |
| Data               | TanStack Query, Table, Form                                                                  |
| Analitik           | Google Analytics (web) + PostHog (produk)                                                    |
| Observability      | Logger `packages/observability` → Workers Logs + BetterStack; error → PostHog Error Tracking |
| Lint & format      | Ultracite (Oxlint + Oxfmt)                                                                   |
| Git hooks          | Husky + lint-staged + commitlint                                                             |
| Testing            | Vitest (+ `@cloudflare/vitest-pool-workers`)                                                 |

**Versi:** saat instalasi awal sebuah paket, pakai versi stabil terbaru. Setelah
itu, ikuti versi di catalog — **jangan upgrade di tengah tugas lain**. Cek API
library dari versi yang terpasang di `package.json` dan dokumentasi resminya,
**jangan menebak dari ingatan**; React Router, Hono, Drizzle, better-auth,
`@hono/zod-openapi`, dan PostHog bergerak cepat.

**Library baru** di luar tabel harus diusulkan dulu (nama, alasan, alternatif,
lokasi catalog) dan menunggu persetujuan.

## Keputusan Arsitektur

Keputusan yang sudah ditetapkan. Jangan menyimpang tanpa persetujuan.

| Topik                       | Keputusan                                                                                                                                                                                         | Detail                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Data fetching halaman       | Loader melakukan auth gate + prefetch ke QueryClient (`ensureQueryData`), lalu di-dehydrate; komponen memakai `useQuery` dengan query key yang sama. Mutasi lewat `useMutation` + invalidasi key. | `docs/react-router.md`  |
| app/web → api saat SSR      | **Service Binding** `API` (bukan URL publik); cookie sesi diteruskan dari request asli.                                                                                                           | `docs/react-router.md`  |
| Cek sesi di app             | Lewat api (`/api/auth/get-session` via Service Binding). `apps/app` dan `apps/web` **tidak** mengakses DB atau mengimpor konfigurasi server better-auth.                                          | `docs/react-router.md`  |
| Template & pengiriman email | Template + fungsi kirim di `packages/email`; `apps/email` hanya server preview; `apps/api` yang memanggil fungsi kirim.                                                                           | —                       |
| Analitik server             | PostHog dari Worker lewat HTTP capture API dengan `fetch` (tanpa SDK Node); `posthog-js` hanya di browser.                                                                                        | `apps/api/CLAUDE.md`    |
| Rate limiting               | Binding Rate Limiting Workers, bukan state in-memory.                                                                                                                                             | `apps/api/CLAUDE.md`    |
| Driver DB                   | `neon-http` untuk query biasa; `neon-serverless` (Pool per request) bila butuh transaksi.                                                                                                         | `packages/db/CLAUDE.md` |

**Keputusan tertunda** (dicatat di `STATUS.md`): bila tugas menyentuhnya,
**berhenti dan tanyakan**, jangan memilih sendiri.

- **Scoping data:** per-user (`user_id`) atau per-organisasi (`organization_id`
  - plugin organization better-auth). Wajib diputuskan sebelum tabel data
    pengguna pertama dibuat.
- **Domain produksi:** semua URL/origin dari env sampai ditetapkan.

## Dependensi (ringkas)

Versi didefinisikan sekali di catalog root agar tidak ada duplikasi versi.
Sebelum memasang, tentukan lokasinya (berhenti di jawaban pertama yang cocok):

1. Paket internal `@bermula/*` → `"workspace:*"`.
2. Tooling khusus root (hook, linter, turbo) → `devDependencies` root, tanpa catalog.
3. Termasuk kelompok `catalogs` (`react`, `ui`, `tanstack`, `api`, `db`,
   `services`, `test`, `storybook`) → catalog bernama tersebut.
4. Dipakai ≥2 workspace → `catalog` default.
5. Hanya satu workspace → pasang langsung di workspace itu.

Isi lengkap catalog, aturan teknis, dan cara upgrade: **`docs/dependencies.md`**.
Sebutkan lokasi + alasan satu kalimat di "Catatan" laporan.

---

## Struktur Folder

```
bermula/
├── apps/
│   ├── web/            # Marketing — React Router (SSR) → Workers
│   ├── app/            # Aplikasi utama — React Router (SSR) → Workers
│   │   └── app/{routes,features,components,lib}
│   ├── api/            # Hono → Workers
│   │   └── src/{routes,services,middleware,openapi.ts,index.ts}
│   ├── email/          # Server preview React Email (template diimpor dari packages/email)
│   └── storybook/      # Katalog komponen design-system
├── packages/
│   ├── env/            # Skema t3-env untuk web, app, api
│   ├── db/             # Skema Drizzle, klien Neon, migrasi, seed
│   ├── auth/           # Konfigurasi better-auth (server & client)
│   ├── core/           # Logika domain murni (tanpa I/O) + skema Zod bersama
│   ├── design-system/  # Tailwind, globals.css, komponen shadcn/ui, dark mode, cn()
│   ├── data/           # TanStack Query (client+provider), helper Form & Table
│   ├── payments/       # Stripe: client + webhook handler
│   ├── email/          # Template React Email + fungsi kirim Resend
│   ├── storage/        # Cloudflare R2: binding + presigned URL
│   ├── analytics/      # GA (web) + PostHog
│   ├── observability/  # Logger, BetterStack, PostHog Error Tracking
│   ├── seo/            # Metadata, sitemap, JSON-LD
│   └── typescript-config/ # Preset tsconfig bersama (base, react)
├── docs/               # Dokumen rujukan untuk AI & developer
├── turbo.json · package.json · bun.lock
├── AGENTS.md · CLAUDE.md · DESIGN.md · STATUS.md · README.md
```

- Kode diletakkan sedekat mungkin dengan pemakainya; angkat ke `packages/` hanya
  bila dipakai >1 app.
- `packages/core`: fungsi murni tanpa DB, fetch, atau React — dipakai klien
  (umpan balik instan) dan server (validasi), dan mudah diuji.
- Fitur baru = satu folder di `apps/app/app/features/`, ditambah modul di
  `apps/api/src/routes/` dan `services/` bila butuh data server.
- Arah dependensi: `apps/*` → `packages/*`. Paket tidak mengimpor dari `apps/`,
  kecuali **impor tipe** `AppType` dari `apps/api` oleh `apps/web`/`apps/app`.

## Konvensi Penamaan

- File: `kebab-case` (termasuk komponen: `user-menu.tsx`).
- Komponen & tipe: `PascalCase`, tipe tanpa prefiks `I`.
- Fungsi, variabel, hook: `camelCase`. Konstanta modul: `UPPER_SNAKE_CASE`.
- Tanpa `enum`: pakai objek `as const` + tipe turunannya.
- DB: `snake_case` di Postgres, `camelCase` di kode (`snakeCase.table(...)`).
- Route API: kata benda jamak `kebab-case` (`/api-keys`).
- Tanpa barrel file; impor langsung dari file sumber. Pengecualian: titik masuk
  paket lewat field `exports` di `package.json`.

## Environment Variable

- **File contoh lebih dulu.** Sebelum menulis kode yang butuh env, buat/perbarui
  `.dev.vars.example` (Workers) atau `.env.example` (tooling Node, mis.
  `packages/db`) di root app/paket tersebut, dengan format:

  ```
  # Fungsi: URL koneksi database Neon
  # Wajib: ya | Sisi: server | Contoh format: postgresql://user:pass@host/db?sslmode=require
  DATABASE_URL=
  ```

  Nilai kosong atau placeholder aman, **tidak pernah secret nyata**.

- Variabel yang sama didefinisikan di skema t3-env (`packages/env`); nama dan
  jumlahnya harus selalu cocok dengan file contoh.
- Kode aplikasi membaca env **hanya** lewat objek t3-env. Pembacaan langsung
  `process.env` / `import.meta.env` hanya boleh di `packages/env` dan file
  konfigurasi tooling (`vite.config.ts`, `drizzle.config.ts`, dll.).
- Variabel client wajib berawalan `VITE_` dan tidak boleh berisi secret.
- Di Workers env datang dari binding saat request, bukan saat modul dimuat:
  `c.env` di Hono; `context.cloudflare.env` di loader/action React Router.
- Dev lokal: salin file contoh ke `.dev.vars`. Secret produksi:
  `wrangler secret put`. Jangan taruh secret di `wrangler.jsonc` atau repo.
- Laporkan setiap env baru: lokasi file contoh dan tempat menyetelnya.

## Autentikasi & Otorisasi

- Konfigurasi better-auth di `packages/auth`; handler di `apps/api` (`/api/auth/*`).
- app/web dan api berbeda Worker: saat deploy pakai subdomain satu domain induk,
  cookie lintas-subdomain, `trustedOrigins`, dan CORS `credentials: true` dengan
  origin eksplisit (bukan `*`).
- Semua URL/origin dari env (`WEB_URL`, `APP_URL`, `API_URL`, `BETTER_AUTH_URL`,
  `CORS_ORIGINS`); `localhost` untuk development. **Jangan hardcode domain.**
- Setiap route yang mengakses data pengguna melewati middleware auth. Otorisasi
  dicek di service: pengguna hanya membaca/mengubah data miliknya (atau milik
  organisasinya, sesuai keputusan scoping).
- Proteksi halaman di **loader** (redirect ke login), bukan hanya di UI.
- Email verifikasi & reset password lewat `packages/email`.

## Standar Kode

- Dilarang `any`, `@ts-ignore`, dan non-null assertion `!` tanpa alasan tertulis.
  Gunakan `unknown` + penyempitan tipe. `@ts-expect-error` hanya dengan komentar alasan.
- Fungsi kecil, satu tanggung jawab; >3 parameter digabung jadi objek.
- Lapisan: `routes` (HTTP, validasi, dokumentasi) → `services` (logika bisnis)
  → `packages/db`. Route tidak memanggil DB langsung.
- Jangan menulis tipe request/response API secara manual; turunkan dari sumbernya
  (`AppType` via `hc`, `z.infer`, `$inferSelect`).
- Tangani error secara eksplisit; tanpa `catch` kosong.
- Tanpa `console.log`; pakai logger dari `packages/observability`.
- Komentar menjelaskan **alasan**, bukan mengulang kode.
- Ekstrak util jika pola muncul ≥2 kali.
- Jangan memakai API khusus Node tanpa memastikan kompatibel di Workers
  (aktifkan `nodejs_compat` bila perlu, dan sebutkan di laporan).

## Standar UI

- **Baca `DESIGN.md` sebelum tugas UI apa pun**; daftar periksanya bagian dari
  Definisi Selesai.
- Komponen shadcn lewat CLI (`bunx shadcn@latest add ...`), jangan disalin manual.
- Mobile-first; setiap komponen pemuat data punya state loading, error, kosong.
- Form: TanStack Form + skema Zod yang sama dengan api.
- Angka, tanggal, mata uang lewat satu formatter terpusat (default `id-ID`).

## Lint & Format

- Ultracite = preset; Oxlint = linter; Oxfmt = formatter. Satu sistem.
- Perintah: `bun run check`, `bun run fix`, `bunx ultracite doctor`.
- Jangan menambah ESLint, Prettier, atau Biome.
- Jangan menonaktifkan aturan lint inline tanpa komentar alasan.
- `ultracite init` dapat membuat file aturan agent sendiri. File itu dipertahankan
  dan dirujuk dari sini, **bukan** menimpa `CLAUDE.md` ini.

## Pengujian

- **Vitest**, bukan `bun test`: berbagi pipeline Vite dan bisa menjalankan kode
  Worker di workerd asli. File uji di samping sumbernya (`x.ts` → `x.test.ts`).
- Lingkungan per jenis kode:
  - Fungsi murni & util → Vitest default (Node).
  - Komponen React → Vitest + `happy-dom` + `@testing-library/react`.
  - Kode Worker (Hono, binding R2/DB) → `@cloudflare/vitest-pool-workers`.
- Konfigurasi Vitest meng-extend `vite.config` app. Jalankan lewat `bun run test`.
- Wajib diuji: fungsi di `packages/core`, service berlogika bisnis, skema Zod
  penting, util lintas fitur.
- Deterministik: tanpa jaringan nyata, tanpa DB produksi, waktu "sekarang"
  disuntikkan sebagai parameter.

## Git (ringkas)

Detail format branch, commit, dan hook: **`docs/git.md`**.

- Branch `tipe/deskripsi-singkat`; commit Conventional Commits berbahasa Inggris.
- **Boleh:** buat branch, `git add`, commit setelah Definisi Selesai terpenuhi.
- **Minta izin dulu:** `git push`, merge ke `main`, rebase, hapus branch.
- **Dilarang:** `--force` push, `--no-verify`, `git reset --hard` tanpa izin eksplisit.
- Jangan pernah commit secret, `.env*` (kecuali `.env.example`), atau `.dev.vars`.

## Perintah Umum

Pakai skrip ini, jangan memanggil tool langsung bila skripnya ada:

| Perintah                                           | Fungsi                                                 |
| -------------------------------------------------- | ------------------------------------------------------ |
| `bun install`                                      | Pasang dependensi                                      |
| `bun run dev` / `build`                            | Jalankan / build semua app (turbo)                     |
| `bun run typegen`                                  | Hasilkan tipe React Router & binding Workers           |
| `bun run check-types`                              | Type-check (bergantung pada `typegen` di `turbo.json`) |
| `bun run check` / `fix`                            | Lint & format via Ultracite                            |
| `bun run test`                                     | Unit test (Vitest)                                     |
| `bun run db:generate` / `db:migrate` / `db:studio` | Migrasi Drizzle (lokal/dev)                            |
| `bun run deploy`                                   | Deploy ke Cloudflare (per app)                         |

Jika skrip belum ada, tambahkan ke `package.json` dan task di `turbo.json`.

---

## Cara Bekerja

- **Baca `STATUS.md` di awal setiap tugas.** Jangan mengasumsikan paket atau
  file sudah ada; periksa dulu. Perbarui `STATUS.md` setelah tugas selesai.
- Sesuaikan proses dengan risiko:
  - **Kecil** (satu file, tanpa skema DB/auth): langsung kerjakan.
  - **Menengah** (beberapa file atau >1 app/paket): rencana 2–4 baris, lalu kerjakan.
  - **Berisiko** (skema DB, auth, pembayaran, webhook, hapus data, konfigurasi
    deploy, keputusan tertunda): tulis rencana, tunggu persetujuan.
- Jika permintaan kurang jelas dan salah tebak mahal, tanyakan maksimal 3 hal.
  Jika murah diperbaiki, kerjakan dengan asumsi wajar dan sebutkan asumsinya.
- Baca hanya kode terkait; pakai ulang pola yang sudah ada.
- Saat iterasi, jalankan check dengan `--filter` pada paket yang berubah. Sebelum
  commit, jalankan `check-types`, `check`, dan `test` penuh.
- Bila integrasi tak punya pola bersih di stack ini, **hentikan dan laporkan opsi
  - trade-off**; jangan memaksakan solusi rapuh.
- Temuan di luar tugas cukup disebutkan di laporan, kecuali menghalangi tugas.
- Jika informasi tidak cukup untuk menulis kode yang benar, katakan "informasi
  tidak cukup" dan bertanya. Jangan mengarang skema, endpoint, atau API library.

## Format Keluaran

Ubah file langsung di repo. Tugas kecil: laporan 1–3 kalimat. Tugas besar,
sertakan bagian yang relevan saja:

- **Ringkasan** · **Perubahan** (file + alasan singkat, termasuk file di luar
  cakupan) · **Kode penting** (cuplikan, bukan seluruh file) · **Verifikasi**
  (type-check, lint, test) · **Catatan** (asumsi, dependensi baru + lokasi
  catalog, env baru + lokasi & tempat menyetel, langkah manual) ·
  **Usulan berikutnya** (1–2 langkah).

Bahasa penjelasan: Indonesia. Kode, nama, commit, istilah teknis: Inggris.
Teks UI pengguna akhir: Indonesia (default).

## Batasan

- Hanya TypeScript untuk kode sumber. File konfigurasi tooling juga `.ts` bila
  tool mendukung (mis. `commitlint.config.ts`); `.js`/`.mjs` hanya bila tool
  mewajibkannya, dengan komentar alasan.
- Tidak menambah dependensi tanpa persetujuan.
- Tidak menulis secret nyata ke file mana pun.
- Tidak hardcode domain atau origin.
- Tidak menjalankan migrasi ke database produksi tanpa izin eksplisit.

## Definisi Selesai

Lewati poin yang tidak relevan:

- [ ] `bun run check-types`, `bun run check` (tanpa error & warning), dan
      `bun run test` lolos; logika baru/berubah punya test.
- [ ] Tidak ada `any`, `@ts-ignore`, `console.log`, atau TODO yang menutupi bug.
- [ ] Struktur file dan penamaan sesuai dokumen ini.
- [ ] Input eksternal tervalidasi Zod.
- [ ] Endpoint baru/berubah terdokumentasi di OpenAPI dan tampil benar di `/docs`.
- [ ] Env baru ada di file contoh dan skema t3-env.
- [ ] Data pengguna dibatasi kepemilikan; route sensitif dilindungi auth.
- [ ] Akses R2 lewat `packages/storage`; file privat via presigned URL.
- [ ] Migrasi dibuat bila skema berubah.
- [ ] Dependensi baru sesuai `docs/dependencies.md`; `bun.lock` ikut di-commit.
- [ ] Tugas UI: daftar periksa `DESIGN.md` terpenuhi.
- [ ] `STATUS.md` diperbarui.
- [ ] Commit sesuai Conventional Commits dan hook lolos.
- [ ] Laporan sesuai Format Keluaran diberikan.

## Kriteria Sukses

Lolos type-check, lint, dan test; monorepo rapi dan konsisten; tipe mengalir dari
skema DB → kontrak API → klien; API terdokumentasi lengkap; semua app berjalan di
Workers; mudah dipelihara developer tingkat menengah tanpa penjelasan tambahan.
