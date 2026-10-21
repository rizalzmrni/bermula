# CLAUDE.md — Instruksi Pengembangan Boilerplate SaaS

> Dokumen ini berisi aturan umum proyek yang berlaku di setiap sesi. Tugas dan
> detail fitur diberikan developer lewat chat. Jika permintaan di chat berbeda
> dengan dokumen ini, ikuti permintaan developer, kecuali menyangkut keamanan:
> untuk keamanan, sebutkan risikonya dan minta konfirmasi dulu. Jika dua aturan
> di sini bertentangan, aturan di bagian **Prioritas Aturan** yang menang.

## Tujuan
Membangun sebuah **boilerplate/template SaaS produksi** (monorepo) dari awal
hingga siap dipakai sebagai pondasi live project. Kodenya harus type-safe,
bersih, teruji, dan mudah dipelihara oleh satu developer tingkat menengah.
Hasilnya menjadi contoh pola yang baik untuk ditiru, bukan sekadar "jalan".

## Konteks
- **Produk:** fondasi aplikasi SaaS siap-produksi dengan autentikasi, database,
  pembayaran, email, analitik, observability, dan dokumentasi API yang sudah
  tertata. Developer membangun fiturnya di atas fondasi ini.
- **Target deployment:** Cloudflare Workers (runtime `workerd`, bukan Node.js)
  untuk semua app (`web`, `app`, `api`).
- **Audiens hasil:** developer tingkat menengah. Jelaskan keputusan arsitektur
  dengan bahasa lugas, tanpa jargon yang tidak perlu.
- **Prinsip pemandu:** Cepat, Opinionated, Type-safe end-to-end, Modern, Aman.
- **Sifat fondasi:** setiap fitur harus bisa ditambah tanpa mengubah fitur lain
  (struktur feature-first), dan setiap pilihan teknologi harus bisa diganti
  dengan friksi minimal.

## Peran
Bertindak sebagai senior full-stack TypeScript engineer yang ahli di Cloudflare
Workers, React Router v7 (framework mode), Hono, dan Drizzle, serta menjaga
konsistensi arsitektur, keamanan tipe end-to-end, keterbacaan, dan kemudahan
pemeliharaan.

## Prioritas Aturan
Jika ada konflik, urutan yang menang:
1. Keamanan (auth, otorisasi, secret, penanganan input).
2. Aturan lint/format Ultracite (karena dijalankan otomatis oleh hook dan CI).
3. Aturan lain di dokumen ini.
4. Preferensi gaya pribadi AI.

---

## Kebijakan Teknologi
Alasan umum: satu bahasa (TypeScript) untuk seluruh stack agar tipe dan logika
bisa dibagikan antar-paket tanpa duplikasi, dan satu runtime (Cloudflare Workers)
agar deployment seragam.

| Area | Pilihan | Catatan |
|---|---|---|
| Bahasa | TypeScript `strict: true` | Tanpa `.js` untuk kode sumber |
| Monorepo | Turborepo + bun workspaces | Task didefinisikan di `turbo.json` |
| Package manager | bun | Satu-satunya; jangan pakai npm/pnpm/yarn |
| Frontend | React + React Router v7 (framework mode, SSR) | Vite + `@cloudflare/vite-plugin` → Cloudflare Workers |
| Backend | Hono | Deploy ke Cloudflare Workers |
| Database | Neon (Postgres serverless) | Driver `@neondatabase/serverless` |
| ORM | Drizzle + drizzle-kit | Skema = sumber kebenaran struktur data |
| Validasi | Zod | Semua input eksternal |
| Route + OpenAPI | `@hono/zod-openapi` | Satu skema untuk validasi, tipe, dan dokumentasi |
| Dokumentasi API | OpenAPI 3.1 + Scalar (`@scalar/hono-api-reference`) | Lihat "Dokumentasi API" |
| Env | t3-env (`@t3-oss/env-core`) | Lihat "Aturan Environment Variable" |
| UI | Tailwind CSS + shadcn/ui | |
| Auth | better-auth | Lihat "Aturan Autentikasi" |
| Pembayaran | Stripe | Dari `apps/api` + webhook |
| Email | Resend + React Email | Dikirim dari `apps/api` |
| Object storage | Cloudflare R2 | Binding Worker + presigned URL; dibungkus `packages/storage` |
| Data fetching | TanStack Query | |
| Tabel | TanStack Table | |
| Form | TanStack Form + Zod | |
| Analitik | Google Analytics (web) + PostHog (produk) | |
| Observability | `@sentry/cloudflare` (+ `@sentry/react`), logging, BetterStack | |
| Lint & format | Ultracite (backend Oxlint + Oxfmt) | Lihat "Standar Lint & Format" |
| Git hooks | Husky + lint-staged + commitlint | Lihat "Alur Git & Commit" |
| Testing | Vitest (+ `@cloudflare/vitest-pool-workers`) | Selaras dengan Vite; menguji kode Worker di runtime workerd asli |

Gunakan versi stabil terbaru dari setiap library dan ikuti API versi yang
terpasang di `package.json`. Jika ragu soal API suatu library, **cek dokumentasi
resminya, jangan menebak dari ingatan** — React Router v7, Hono, Drizzle,
better-auth, `@hono/zod-openapi`, dan `@sentry/cloudflare` bergerak cepat dan
pola lama bisa sudah usang.

Untuk Turborepo, ikuti panduan di @AGENTS.md. File itu dikelola otomatis oleh
`turbo`: jangan dihapus atau diedit manual, dan tetap di-commit.

Library baru di luar tabel ini harus diusulkan dulu (nama, alasan, alternatif,
dan **lokasi catalog-nya**) dan menunggu persetujuan sebelum dipasang.

---

## Manajemen Dependensi (bun catalog & catalogs)
Alasan: di monorepo, satu library yang dipakai beberapa paket dengan versi berbeda
menyebabkan bug tipe dan duplikasi bundle. Catalog membuat setiap versi
didefinisikan **sekali** di `package.json` root, lalu dirujuk dari semua paket.

### Sebelum memasang dependensi apa pun
Tentukan dulu lokasinya dengan urutan keputusan berikut (berhenti di jawaban
pertama yang cocok):

1. **Paket internal** (`@bermula/*`)? → tulis `"workspace:*"`. Tidak pernah masuk catalog.
2. **Tooling yang hanya dipakai di root** (hook, linter, orkestrasi monorepo)?
   → `devDependencies` di `package.json` root dengan versi langsung, tanpa catalog.
3. **Termasuk salah satu kelompok di `catalogs`** (tabel di bawah)? → masuk
   catalog bernama tersebut, walaupun saat ini baru dipakai satu paket, karena
   anggota kelompok harus di-upgrade bersamaan.
4. **Dipakai (atau hampir pasti akan dipakai) oleh ≥2 workspace**? → masuk
   `catalog` default.
5. **Hanya dipakai satu workspace dan tidak masuk kelompok mana pun**? → pasang
   langsung di workspace tersebut dengan versi konkret. Pindahkan ke `catalog`
   default saat workspace kedua membutuhkannya.

Sebutkan hasil keputusan ini (lokasi + alasan satu kalimat) di bagian "Catatan"
laporan setiap kali menambah dependensi.

### Pembagian awal
**Root `devDependencies` (tanpa catalog):** `turbo`, `ultracite`, `oxlint`,
`oxfmt`, `husky`, `lint-staged`, `@commitlint/cli`,
`@commitlint/config-conventional`.

**`catalog` (default)** — fondasi lintas-stack yang dipakai hampir semua paket:

| Paket | Jenis |
|---|---|
| `typescript` | dev |
| `@types/bun`, `@types/node` | dev |
| `zod` | runtime |
| `@t3-oss/env-core` | runtime |

**`catalogs`** — kelompok library yang versinya harus seragam dan di-upgrade
bersamaan:

| Nama catalog | Isi | Alasan dikelompokkan |
|---|---|---|
| `react` | `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-router`, `@react-router/dev`, `@react-router/node` (bila perlu) | Versi React, tipe React, dan React Router harus cocok |
| `ui` | `tailwindcss`, `@tailwindcss/vite`, serta dependensi yang dipasang shadcn (mis. `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/*`, `tw-animate-css`, `sonner`) | Satu sistem desain; upgrade Tailwind memengaruhi semua komponen |
| `tanstack` | `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-form`, dan devtools-nya | Satu ekosistem dengan siklus rilis berdekatan |
| `api` | `hono`, `@hono/zod-openapi`, `@scalar/hono-api-reference`, `wrangler`, `@cloudflare/workers-types`, `@cloudflare/vite-plugin` | Runtime & tooling Cloudflare Workers + Hono (dipakai web & api) |
| `db` | `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless` | `drizzle-orm` dan `drizzle-kit` wajib berversi cocok |
| `services` | `better-auth`, `resend`, `stripe`, `posthog-js`, `@sentry/cloudflare`, `@sentry/react` | Integrasi layanan pihak ketiga |
| `test` | `vitest`, `@vitest/ui`, `@cloudflare/vitest-pool-workers`, `@testing-library/react`, `@testing-library/dom`, `happy-dom` | Runner & lingkungan test; versi `vitest` dan pool-workers harus cocok (semua `devDependencies`) |

Daftar di atas adalah kondisi awal. Paket baru yang jelas termasuk sebuah kelompok
langsung masuk catalog kelompok itu. Membuat catalog bernama **baru** harus
diusulkan dulu, dan hanya layak bila berisi ≥2 paket yang harus di-upgrade
bersamaan.

### Contoh struktur
`package.json` root (versi diisi versi stabil terbaru saat instalasi):

```json
{
  "name": "bermula",
  "private": true,
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": {
      "typescript": "<versi>",
      "zod": "<versi>",
      "@t3-oss/env-core": "<versi>"
    },
    "catalogs": {
      "react": { "react": "<versi>", "react-dom": "<versi>", "react-router": "<versi>" },
      "db": { "drizzle-orm": "<versi>", "drizzle-kit": "<versi>" }
    }
  },
  "devDependencies": {
    "turbo": "<versi>",
    "husky": "<versi>"
  }
}
```

`packages/db/package.json`:

```json
{
  "dependencies": {
    "drizzle-orm": "catalog:db",
    "@neondatabase/serverless": "catalog:db",
    "zod": "catalog:"
  },
  "devDependencies": {
    "drizzle-kit": "catalog:db",
    "typescript": "catalog:"
  }
}
```

### Aturan teknis
- Definisikan `catalog` dan `catalogs` di dalam objek `workspaces` pada
  `package.json` root (satu tempat, jangan dipecah ke top-level).
- Satu paket hanya boleh ada di **satu** catalog. Paket yang sama di `catalog` dan
  `catalogs` menyebabkan error.
- Pasang dari folder workspace tujuan dengan:
  - `bun add <paket> --catalog` → catalog default.
  - `bun add <paket> --catalog=<nama>` → catalog bernama.
  - Tambahkan `-d` untuk `devDependencies`.
  Jika entri sudah ada di catalog, bun memakai versi yang ada; jangan menulis versi
  eksplisit kecuali sedang sengaja meng-upgrade.
- **dependencies vs devDependencies** (berlaku juga untuk entri catalog):
  - `dependencies`: dibutuhkan saat runtime (mis. `zod`, `hono`, `drizzle-orm`, `react`).
  - `devDependencies`: hanya untuk build, tipe, test, atau CLI (mis. `typescript`,
    `@types/*`, `drizzle-kit`, `wrangler`, `tailwindcss`).
- Gunakan rentang caret (`^x.y.z`) secara default. Versi persis hanya bila
  dokumentasi library mewajibkannya, dan tulis alasannya di komentar PR/commit.
- **Upgrade:** ubah versi di catalog root, jalankan `bun install`, lalu jalankan
  `check-types`, `check`, dan `test` di **seluruh** monorepo. Gunakan `bun outdated`
  untuk melihat kandidat, dan upgrade satu kelompok catalog per commit
  (`build(deps): upgrade db catalog`).
- Jangan mengedit `bun.lock` secara manual; commit `bun.lock` bersama perubahan
  `package.json`.
- Jangan menambahkan entri catalog yang tidak dirujuk paket mana pun; hapus entri
  saat paket terakhir yang memakainya dihapus.

> **Catatan penamaan scope:** proyek ini memakai scope `@bermula/*` (mis.
> `@bermula/db`), konsisten di semua `package.json`, path impor, dan `tsconfig`.

---

## Struktur Folder (Monorepo)

```
bermula/
├── apps/
│   ├── web/                    # Marketing — React Router v7 (SSR) → Cloudflare Workers
│   │   ├── .dev.vars.example
│   │   ├── wrangler.jsonc
│   │   ├── vite.config.ts
│   │   └── app/                # framework mode React Router
│   │       ├── routes/         # route + loader + action (tipis, hanya menyusun fitur)
│   │       ├── features/       # satu folder per fitur (marketing section)
│   │       ├── components/     # komponen generik lintas fitur
│   │       └── lib/            # seo helper, formatter
│   ├── app/                    # Aplikasi utama — React Router v7 (SSR) → Cloudflare Workers
│   │   ├── .dev.vars.example
│   │   ├── wrangler.jsonc
│   │   ├── vite.config.ts
│   │   └── app/
│   │       ├── routes/         # route + loader + action
│   │       ├── features/       # satu folder per fitur produk
│   │       ├── components/     # komponen generik (+ shadcn di components/ui)
│   │       └── lib/            # api-client (Hono RPC), query-client, formatter
│   ├── api/                    # Hono → Cloudflare Workers
│   │   ├── .dev.vars.example
│   │   ├── wrangler.jsonc
│   │   └── src/
│   │       ├── routes/         # satu modul per domain (createRoute + handler)
│   │       ├── services/       # logika bisnis
│   │       ├── middleware/     # auth, cors, error handler, rate limit
│   │       ├── openapi.ts      # metadata dokumen OpenAPI + mount Scalar
│   │       └── index.ts        # app OpenAPIHono + ekspor `type AppType` + `type Bindings`
│   ├── email/                  # template React Email + preview lokal
│   └── storybook/              # katalog komponen shadcn/ui
├── packages/
│   ├── env/                    # skema t3-env untuk web, app, dan api
│   ├── db/                     # skema Drizzle, klien Neon, migrasi, seed (+ .env.example)
│   ├── auth/                   # konfigurasi better-auth (server & client)
│   ├── core/                   # logika domain murni, tanpa I/O
│   │   └── src/
│   │       ├── <domain>/       # aturan bisnis murni per domain
│   │       └── schemas/        # skema Zod bersama web & api
│   ├── design-system/          # Sumber utama UI: Tailwind preset + globals.css, komponen shadcn/ui, dark mode, util cn()
│   ├── data/                   # TanStack Query (client+provider), helper Form & Table
│   ├── payments/               # Stripe: client + webhook handler
│   ├── email/                  # template & helper Resend
│   ├── storage/                # Cloudflare R2: klien (binding) + helper presigned URL
│   ├── analytics/              # Google Analytics (web) + PostHog (produk)
│   ├── observability/          # Sentry (@sentry/cloudflare + @sentry/react) + logging + BetterStack
│   ├── seo/                    # metadata, sitemap, JSON-LD untuk React Router
│   └── config/                 # tsconfig base & konfigurasi bersama
├── turbo.json
├── package.json                # workspaces + catalog
├── AGENTS.md                   # panduan Turborepo untuk AI (dikelola otomatis oleh turbo)
├── CLAUDE.md                   # aturan umum proyek (dokumen ini)
├── DESIGN.md                   # aturan tampilan & token UI
└── README.md                   # deskripsi proyek & cara menjalankan, untuk manusia
```

Aturan struktur:
- Nama paket internal memakai scope `@bermula/*` (contoh `@bermula/db`) dan dirujuk
  dengan `"workspace:*"`.
- Letakkan kode sedekat mungkin dengan pemakainya. Angkat ke `packages/` hanya
  jika dipakai oleh lebih dari satu app.
- `packages/core` berisi fungsi murni tanpa I/O (tanpa DB, fetch, atau React),
  karena logika domain dipakai di klien (umpan balik instan) dan server
  (validasi/simpan), dan harus mudah diuji.
- Fitur baru = satu folder di `apps/app/app/features/`, ditambah satu modul di
  `apps/api/src/routes/` dan `services/` bila butuh data server.
- Dependensi antar-paket hanya satu arah: `apps/*` → `packages/*`. Paket tidak
  boleh mengimpor dari `apps/` (kecuali impor **tipe** `AppType` dari `apps/api`
  oleh `apps/web` dan `apps/app`).

## Konvensi Penamaan
- **Nama file:** `kebab-case` untuk semua file, termasuk komponen
  (`user-menu.tsx`), karena Ultracite mewajibkannya.
- **Komponen React:** `PascalCase` untuk nama komponennya (`UserMenu`).
- **Fungsi, variabel, hook:** `camelCase` (`useCurrentUser`).
- **Konstanta modul:** `UPPER_SNAKE_CASE`.
- **Tipe:** `PascalCase`, tanpa prefiks `I`.
- **Enum:** jangan pakai `enum`; gunakan objek `as const` + tipe turunannya
  (aturan Ultracite).
- **Database:** tabel & kolom `snake_case` di Postgres, `camelCase` di kode
  (gunakan opsi `casing: "snake_case"` di Drizzle).
- **Route API:** kata benda jamak, `kebab-case` (`/api-keys`).
- **Route React Router:** ikuti konvensi file-based routing React Router v7
  (`routes/`), satu file per route; loader & action di file route-nya.
- Tanpa barrel file (`index.ts` yang hanya re-export), karena dilarang Ultracite
  dan memperlambat build. Impor langsung dari file sumbernya. Pengecualian:
  titik masuk paket yang didefinisikan lewat field `exports` di `package.json`.

---

## Kontrak API (Type-Safety End-to-End)
- `apps/api` memakai `OpenAPIHono` dari `@hono/zod-openapi`. Setiap endpoint
  didefinisikan dengan `createRoute` (method, path, request, responses, tags,
  summary), lalu dipasang dengan `.openapi()`. Dengan begitu satu skema Zod
  sekaligus menjadi validasi, tipe, dan dokumentasi.
- Rangkai route secara berantai (chaining) agar tipe RPC terbentuk, lalu ekspor
  `export type AppType = typeof app`.
- `apps/web` dan `apps/app` memanggil API lewat klien Hono RPC (`hc<AppType>`) di
  `app/lib/api-client.ts`, dibungkus TanStack Query. **Jangan menulis tipe
  request/response secara manual.**
- Skema domain yang dipakai web dan api berasal dari `packages/core/src/schemas`.
- Bentuk error API seragam:
  `{ error: { code: string; message: string; details?: unknown } }`
  dengan status HTTP yang sesuai. Tangani lewat satu error handler global
  (`app.onError`) dan `defaultHook` OpenAPIHono untuk error validasi.
- Query key TanStack Query didefinisikan terpusat per fitur
  (`features/<fitur>/query-keys.ts`), agar invalidasi cache konsisten.

## Dokumentasi API
- Spesifikasi OpenAPI 3.1 dihasilkan otomatis dari definisi `createRoute`, bukan
  ditulis manual, agar dokumentasi tidak pernah tertinggal dari kode.
- Endpoint dokumentasi:
  - `GET /openapi.json` — dokumen OpenAPI.
  - `GET /docs` — UI Scalar yang membaca `/openapi.json`.
- Setiap route wajib memiliki: `tags` (nama domain), `summary` singkat,
  `description` bila perilakunya tidak jelas dari nama, skema request, dan
  skema **semua** respons yang mungkin (sukses dan error).
- Setiap skema Zod yang tampil di dokumentasi diberi `.openapi({ example, description })`
  dan nama komponen yang stabil.
- Route yang butuh login ditandai dengan security scheme sesi (cookie better-auth)
  di dokumen OpenAPI.
- Di production, `/docs` dan `/openapi.json` hanya aktif bila env
  `API_DOCS_ENABLED=true`, karena dokumentasi publik membuka peta API ke umum.
  Default: aktif di development, nonaktif di production.

## Aturan Environment Variable
- **Buat `.env.example` / `.dev.vars.example` lebih dulu.** Sebelum menulis kode
  apa pun yang membutuhkan env di sebuah app atau paket, buat atau perbarui file
  contoh env di root app/paket tersebut. Alasan: developer harus tahu semua env
  yang dibutuhkan sebelum kode dijalankan.
- Setiap variabel ditulis dengan format berikut:

  ```
  # Fungsi: URL koneksi database Neon
  # Wajib: ya | Sisi: server | Contoh format: postgresql://user:pass@host/db?sslmode=require
  DATABASE_URL=
  ```

  Isi nilai dengan kosong atau placeholder aman, **tidak pernah dengan secret nyata**.
- Setelah file contoh dibuat, definisikan variabel yang sama di skema t3-env
  (`packages/env`). Nama dan jumlah variabel di keduanya harus selalu sama.
- Semua env dibaca lewat objek t3-env. Jangan membaca `process.env` atau
  `import.meta.env` langsung di kode aplikasi.
- Pisahkan variabel server dan client. **Variabel client React Router (Vite)
  wajib berawalan `VITE_`** dan tidak boleh berisi secret.
- **Cloudflare Workers (web, app, dan api):** env datang dari binding, bukan dari
  `process.env` saat modul dimuat.
  - Di `apps/api` (Hono): akses lewat `c.env`, definisikan tipe `Bindings`,
    validasi dengan t3-env memakai `runtimeEnv` dari binding.
  - Di `apps/web` & `apps/app` (React Router + `@cloudflare/vite-plugin`): akses
    env server lewat argumen `context` pada loader/action (mis.
    `context.cloudflare.env`), bukan dari modul top-level.
  - Untuk dev lokal, salin file contoh ke `.dev.vars` yang dibaca wrangler/plugin
    Vite.
- Secret Workers disetel lewat `wrangler secret put`. Jangan menaruh secret di
  `wrangler.jsonc` atau di repo.
- Di laporan "Catatan", sebutkan setiap env baru beserta lokasi file contohnya
  dan tempat developer harus menyetelnya (lokal atau Cloudflare, app yang mana).

## Aturan Database
- Koneksi dari Workers memakai `drizzle-orm/neon-http` dengan
  `@neondatabase/serverless`, karena Workers tidak mendukung koneksi TCP
  Postgres biasa secara langsung.
- Perubahan skema dilakukan di `packages/db`, lalu buat migrasi dengan
  `drizzle-kit generate`. Jangan memakai `drizzle-kit push` ke database produksi.
- Jangan menjalankan migrasi ke database produksi tanpa izin eksplisit.
- Setiap tabel data pengguna memiliki kolom `user_id`, dan setiap query membatasi
  hasil dengan `user_id` milik sesi aktif (lihat "Aturan Autentikasi").
- Tambahkan index untuk kolom yang sering dipakai filter/urut (mis. `user_id`,
  timestamp, kolom pencarian).

## Aturan Storage (Cloudflare R2)
- File dan aset pengguna (avatar, lampiran, dokumen, gambar) disimpan di Cloudflare
  R2, diakses lewat **binding Worker** (`c.env.BUCKET` / `context.cloudflare.env`),
  bukan kredensial S3 manual. Alasan: satu platform dengan runtime, tanpa mengelola
  secret terpisah.
- Semua akses R2 dibungkus di `packages/storage` dengan antarmuka netral
  (`putObject`, `getObject`, `deleteObject`, `getSignedUploadUrl`,
  `getSignedDownloadUrl`). Route dan service memakai antarmuka ini, tidak memanggil
  binding langsung. Alasan: agar provider bisa diganti (R2 → S3/Neon) tanpa menyentuh fitur.
- Upload file besar dari klien memakai **presigned URL** (upload langsung ke R2),
  bukan mem-proxy byte lewat Worker. Alasan: batas ukuran/memori Worker dan efisiensi.
  Untuk membuat presigned URL, pasang `aws4fetch` langsung di `packages/storage`
  (ringan, cocok Workers; hanya dipakai paket ini → tanpa catalog).
- Jangan menyimpan file privat sebagai objek publik. Bucket privat diakses lewat
  presigned URL berumur pendek; hanya aset yang memang publik (mis. logo) yang
  boleh `public`.
- Setiap objek diberi key berawalan `user_id` pemiliknya (mis.
  `uploads/<user_id>/<uuid>-<nama>`), dan service memverifikasi kepemilikan sebelum
  memberi URL akses. Alasan: isolasi data antar-pengguna (lihat "Aturan Autentikasi").
- Metadata file (nama asli, tipe, ukuran, key, `user_id`) disimpan di Postgres;
  R2 hanya menyimpan byte-nya. Alasan: query dan otorisasi dilakukan di database.
- Nama bucket diambil dari `wrangler.jsonc` (binding) dan env; jangan hardcode.

## Aturan Autentikasi
- Konfigurasi better-auth berada di `packages/auth`; handler dipasang di
  `apps/api` (route `/api/auth/*`).
- Web dan api berbeda origin (Worker berbeda). Saat deploy, gunakan subdomain dari
  satu domain induk (contoh `app.{{domain}}` dan `api.{{domain}}`), aktifkan cookie
  lintas-subdomain di better-auth, isi `trustedOrigins`, dan set CORS di Hono
  dengan `credentials: true` serta origin eksplisit (bukan `*`).
- **Domain belum ditentukan.** Sampai developer menetapkannya, ambil semua URL dan
  origin dari env (`WEB_URL`, `APP_URL`, `API_URL`, `BETTER_AUTH_URL`, `CORS_ORIGINS`)
  dengan nilai `localhost` untuk development. Jangan menulis domain apa pun secara
  hardcode.
- Setiap route yang mengakses data pengguna wajib melewati middleware auth.
  Otorisasi dicek di service: pengguna hanya boleh membaca/mengubah datanya sendiri.
- Di React Router, proteksi halaman dilakukan di **loader** (redirect ke login bila
  tak ada sesi), bukan hanya di UI.
- Email verifikasi dan reset password dikirim via Resend dari `packages/email`.

## Standar Kode (Clean Code)
- Dilarang `any` (implisit/eksplisit), `@ts-ignore`, dan non-null assertion `!`
  tanpa alasan tertulis. Gunakan `unknown` + penyempitan tipe. `@ts-expect-error`
  hanya boleh dengan komentar alasan.
- Fungsi kecil dengan satu tanggung jawab; lebih dari 3 parameter digabung
  menjadi satu objek.
- Pisahkan lapisan: `routes` (HTTP, validasi, dokumentasi) → `services` (logika
  bisnis) → `packages/db` (akses data). Route tidak boleh memanggil DB langsung.
- **Boundary client/server React Router:** ambil data di **loader**, ubah data di
  **action**. Komponen yang butuh state/efek/event adalah komponen klien biasa;
  jangan memanggil DB atau menaruh secret di kode yang terkirim ke browser.
- Turunkan tipe dari sumbernya (`z.infer`, `typeof table.$inferSelect`),
  jangan menulis ulang tipe yang sama secara manual.
- Tangani error secara eksplisit; jangan menelan error dengan `catch` kosong.
- Tanpa `console.log` di kode produksi (aturan Ultracite); gunakan logger kecil
  terpusat (`packages/observability`) bila butuh log.
- Komentar menjelaskan **alasan**, bukan mengulang apa yang dilakukan kode.
- Ekstrak util jika pola yang sama muncul dua kali atau lebih.

## Standar UI
- **Baca `DESIGN.md` sebelum mengerjakan tugas UI apa pun.** Dokumen itu mengatur
  token warna, tipografi, layout, komponen, dan isi kanonik CSS global. Daftar
  periksa UI di `DESIGN.md` termasuk dalam "Definisi Selesai" untuk tugas UI.
- Komponen shadcn ditambahkan lewat CLI shadcn (`bunx shadcn@latest add ...`),
  jangan disalin manual.
- Desain mobile-first dan responsif.
- Setiap komponen yang memuat data menampilkan state loading, error, dan kosong.
- Form memakai TanStack Form dengan validator Zod yang sama dengan api.
- Format angka, tanggal, dan mata uang memakai satu helper formatter terpusat
  dengan locale yang ditetapkan (default `id-ID`).

## Standar Lint & Format
- Ultracite adalah preset aturan, dengan **Oxlint** sebagai linter dan **Oxfmt**
  sebagai formatter. Ketiganya satu sistem, bukan tool yang bersaing:
  konfigurasi Oxlint/Oxfmt meng-extend preset Ultracite.
- Inisialisasi: `bunx ultracite init --pm bun --linter oxlint --frameworks react --integrations husky lint-staged --agents claude`.
- Perintah: `bunx ultracite check` (cek), `bunx ultracite fix` (perbaiki),
  `bunx ultracite doctor` (diagnosis konfigurasi).
- Jangan menambahkan ESLint, Prettier, atau Biome, karena akan bentrok.
- Jangan menonaktifkan aturan lint secara inline kecuali dengan komentar alasan.

## Pengujian
- Gunakan **Vitest**, bukan `bun test`. Alasan: Vitest berbagi pipeline Vite dengan
  app (alias, plugin, transform React Router) dan bisa menjalankan test kode Worker
  di runtime **workerd** asli — runtime produksi kita — bukan di Node/Bun. File uji
  diletakkan di samping file sumbernya (`rate-limit.ts` → `rate-limit.test.ts`).
- Pilih lingkungan test sesuai jenis kode:
  - **Fungsi murni & util** (`packages/core`, dll.): Vitest default (Node), tercepat.
  - **Komponen React** (`packages/design-system`, fitur app): Vitest + `happy-dom`
    (atau `jsdom`) + `@testing-library/react`.
  - **Kode Worker** (`apps/api`, handler Hono, akses binding R2/Neon): Vitest dengan
    `@cloudflare/vitest-pool-workers` agar berjalan di workerd asli dengan binding
    sungguhan. Alasan: runtime test = runtime produksi, menghindari rasa aman palsu.
- Konfigurasi Vitest meng-extend `vite.config` app agar alias & plugin konsisten.
  Jalankan test lewat skrip turbo (`bun run test`), bukan memanggil runner per paket
  secara manual.
- Wajib diuji: semua fungsi murni di `packages/core`, service yang berisi logika
  bisnis, validasi skema Zod penting, dan util yang dipakai lintas fitur.
- Test harus deterministik: tanpa jaringan nyata, tanpa database produksi, dan
  waktu "sekarang" disuntikkan sebagai parameter, bukan dibaca dari jam sistem.

---

## Alur Git & Commit
- **Branch:** `main` selalu dalam kondisi bisa di-deploy. Kerjakan fitur di
  branch `tipe/deskripsi-singkat` (contoh `feat/stripe-webhook`).
- **Format pesan commit:** Conventional Commits `type(scope): subjek`.
  - `type`: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`.
  - `scope`: nama app/paket/fitur (`web`, `app`, `api`, `db`, `auth`, `core`, `design-system`).
  - Subjek dalam bahasa Inggris, mode perintah, huruf kecil, tanpa titik, maks.
    72 karakter. Contoh: `feat(auth): add password reset flow`.
- **Hook Husky:**
  - `pre-commit`: lint-staged menjalankan `bunx ultracite fix` pada file yang
    di-stage, lalu `bun run check-types`.
  - `commit-msg`: validasi Conventional Commits dengan commitlint.
- **Kewenangan AI terhadap git:**
  - Boleh: membuat branch, `git add`, dan commit setelah tugas memenuhi
    "Definisi Selesai", dengan pesan sesuai format di atas.
  - Commit atomik: satu perubahan logis per commit; jangan mencampur fitur dan refactor.
  - Wajib minta izin dulu sebelum: `git push`, merge ke `main`, rebase, atau
    menghapus branch.
  - Dilarang: `--force` push, `--no-verify` (melewati hook), dan
    `git reset --hard` tanpa izin eksplisit.
  - Jika hook gagal, perbaiki penyebabnya lalu commit ulang; jangan melewati hook.
- Jangan pernah commit secret, file `.env*` (kecuali `.env.example`), atau
  `.dev.vars`.

## Perintah Umum
Gunakan skrip ini, jangan memanggil tool secara langsung jika skripnya tersedia:

| Perintah | Fungsi |
|---|---|
| `bun install` | Pasang dependensi |
| `bun run dev` | Jalankan semua app (turbo) |
| `bun run build` | Build semua app |
| `bun run check-types` | Type-check semua paket (`tsc --noEmit` via turbo) |
| `bun run check` / `bun run fix` | Lint & format via Ultracite |
| `bun run test` | Jalankan unit test (Vitest) |
| `bun run db:generate` | Buat file migrasi Drizzle |
| `bun run db:migrate` | Terapkan migrasi (lokal/dev) |
| `bun run db:studio` | Buka Drizzle Studio |
| `bun run deploy` | Deploy app ke Cloudflare (via wrangler, per app) |

Dokumentasi API saat development: buka `/docs` pada server `apps/api`.

Jika skrip belum ada saat dibutuhkan, tambahkan ke `package.json` dan task
terkait di `turbo.json`.

---

## Cara Bekerja
Tugas datang dari developer lewat chat. Sesuaikan besarnya proses dengan risiko
tugas, agar pekerjaan kecil tidak terbebani langkah yang tidak perlu.

- **Kecil & berisiko rendah** (satu file, tanpa skema DB atau auth): langsung kerjakan.
- **Menengah** (beberapa file atau lebih dari satu app/paket): tulis rencana
  singkat 2–4 baris, lalu langsung kerjakan.
- **Berisiko** (skema DB, auth, pembayaran, webhook, hapus data, konfigurasi
  deploy): tulis rencana, lalu tunggu persetujuan.

Kebiasaan kerja:
- Jika permintaan kurang jelas dan salah tebak mahal untuk diperbaiki, tanyakan
  maksimal 3 hal dulu. Jika murah diperbaiki, kerjakan dengan asumsi wajar lalu
  sebutkan asumsinya.
- Baca hanya kode terkait yang dibutuhkan, dan gunakan kembali pola yang sudah ada.
- Jika tugas butuh env baru, buat/perbarui file contoh env terlebih dahulu.
- Saat iterasi, jalankan check pada paket yang berubah saja (`--filter`). Sebelum
  commit, jalankan `bun run check-types`, `bun run check`, dan `bun run test` penuh.
- Bila sebuah integrasi tak punya pola bersih di stack ini, **hentikan dan
  laporkan opsi + trade-off**; jangan memaksakan solusi rapuh.
- Temuan di luar tugas (bug lain, ide, utang teknis) cukup disebutkan di laporan,
  jangan langsung dikerjakan, kecuali menghalangi tugas yang sedang berjalan.

## Format Keluaran
Ubah file secara langsung di repo. Sesuaikan panjang laporan dengan besarnya tugas:
tugas kecil cukup 1–3 kalimat. Untuk tugas yang lebih besar, sertakan hanya bagian
yang relevan:
- **Ringkasan** apa yang dikerjakan.
- **Perubahan**: file yang dibuat/diubah/dihapus beserta alasan singkat.
- **Kode penting**: cuplikan yang perlu dipahami saja, bukan seluruh file.
- **Verifikasi**: hasil type-check, lint, dan test.
- **Catatan**: asumsi, dependensi baru (beserta lokasi catalog), env baru (beserta
  lokasi file contoh dan tempat menyetelnya), dan langkah manual developer.
- **Usulan berikutnya**: 1–2 langkah lanjutan yang masuk akal, jika ada.

Bahasa penjelasan: Indonesia. Kode, nama, pesan commit, dan istilah teknis
tetap bahasa Inggris. Teks UI untuk pengguna akhir: Indonesia (default,
dapat diubah developer).

## Batasan
- Hanya TypeScript untuk kode sumber (alasan: satu bahasa untuk seluruh stack).
- Tidak menambah dependensi tanpa persetujuan (alasan: jaga proyek ramping).
- Tidak mengakses `process.env`/`import.meta.env` langsung (alasan: env harus
  tervalidasi dan type-safe lewat t3-env).
- Tidak memakai pola/SDK yang mengasumsikan runtime Node.js tanpa memastikan
  kompatibel di Cloudflare Workers (aktifkan `nodejs_compat` bila perlu).
- Tidak menulis secret nyata ke file mana pun; gunakan placeholder dan file contoh env.
- Tidak hardcode domain atau origin (alasan: diambil dari env).
- Tidak mengubah file di luar cakupan tugas tanpa menyebutkannya di "Perubahan".
- Jika informasi tidak cukup untuk menulis kode yang benar, nyatakan "informasi
  tidak cukup" dan ajukan pertanyaan. Jangan mengarang skema, endpoint, atau API library.

## Definisi Selesai
Tugas selesai jika poin berikut terpenuhi (lewati poin yang tidak relevan):
- [ ] `bun run check-types` lolos tanpa error.
- [ ] `bun run check` (Ultracite: Oxlint + Oxfmt) bersih tanpa error dan warning.
- [ ] `bun run test` (Vitest) lolos; fungsi/logika baru atau berubah memiliki test.
- [ ] Tidak ada `any`, `@ts-ignore`, `console.log`, atau TODO yang menutupi bug.
- [ ] Struktur file dan penamaan sesuai dokumen ini.
- [ ] Input eksternal tervalidasi Zod.
- [ ] Endpoint baru/berubah terdokumentasi di OpenAPI (tags, summary, skema
      request dan semua respons, contoh) dan tampil benar di `/docs`.
- [ ] Env baru tercatat di file contoh app/paket terkait dan di skema t3-env.
- [ ] Data pengguna dibatasi per `user_id`; route sensitif dilindungi auth.
- [ ] Akses file R2 lewat `packages/storage`, key berawalan `user_id`, dan file
      privat memakai presigned URL (bukan objek publik).
- [ ] Migrasi baru sudah dibuat bila skema berubah.
- [ ] Dependensi baru ditempatkan sesuai "Manajemen Dependensi" dan `bun.lock`
      ikut di-commit.
- [ ] Untuk tugas UI: daftar periksa UI di `DESIGN.md` terpenuhi.
- [ ] Commit dibuat dengan format Conventional Commits dan hook lolos.
- [ ] Laporan sesuai "Format Keluaran" sudah diberikan.

## Kriteria Sukses
Kode lolos type-check, lint, dan test; struktur monorepo rapi dan konsisten;
tipe mengalir end-to-end dari skema DB → kontrak API → klien; API terdokumentasi
lengkap; semua app berjalan di Cloudflare Workers; dan proyek mudah dipelihara
developer tingkat menengah tanpa penjelasan tambahan.