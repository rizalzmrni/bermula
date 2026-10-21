# Bermula

> Pondasi SaaS produksi yang siap dikembangkan — monorepo type-safe end-to-end
> di atas React Router v7, Hono, dan Cloudflare Workers.

**Bermula** adalah boilerplate untuk memulai aplikasi SaaS tanpa merakit ulang
fondasi yang sama setiap kali: autentikasi, database, pembayaran, email, object
storage, analitik, observability, dan dokumentasi API sudah tertata dan saling
terhubung. Tinggal bangun fiturmu di atasnya.

Dibuat dengan prinsip: **cepat** dijalankan, **opinionated** (tooling yang dipilih
agar bekerja bersama), **type-safe** dari database sampai UI, **modern**, dan **aman**.

---

## Teknologi

| Area                | Pilihan                                       |
| ------------------- | --------------------------------------------- |
| Bahasa              | TypeScript (strict)                           |
| Monorepo            | Turborepo + Bun workspaces                    |
| Frontend            | React + React Router v7 (framework mode, SSR) |
| Backend / API       | Hono                                          |
| Runtime & deploy    | Cloudflare Workers (Wrangler)                 |
| Database            | Neon (Postgres serverless)                    |
| ORM                 | Drizzle + drizzle-kit                         |
| Autentikasi         | better-auth                                   |
| Pembayaran          | Stripe                                        |
| Email               | Resend + React Email                          |
| Object storage      | Cloudflare R2                                 |
| UI                  | Tailwind CSS + shadcn/ui                      |
| Data / tabel / form | TanStack Query, Table, Form                   |
| Validasi & env      | Zod + t3-env                                  |
| Dokumentasi API     | OpenAPI 3.1 (`@hono/zod-openapi`) + Scalar    |
| Analitik            | Google Analytics (web) + PostHog (produk)     |
| Observability       | Sentry + logging + BetterStack                |
| Lint & format       | Ultracite (Oxlint + Oxfmt)                    |
| Git hooks           | Husky + lint-staged + commitlint              |
| Testing             | Vitest (+ `@cloudflare/vitest-pool-workers`)  |

---

## Struktur Proyek

Monorepo dengan dua folder utama: `apps/` (aplikasi yang dideploy) dan
`packages/` (kode bersama). Setiap app adalah Worker Cloudflare yang berdiri sendiri.

```
bermula/
├── apps/
│   ├── web/        # Situs marketing — React Router v7 (SSR)
│   ├── app/        # Aplikasi utama — React Router v7 (SSR) + auth + data
│   ├── api/        # API — Hono + OpenAPI/Scalar
│   ├── email/      # Template React Email + preview
│   └── storybook/  # Katalog komponen UI
├── packages/
│   ├── env/            # Skema environment variable (t3-env + Zod)
│   ├── db/             # Skema Drizzle, klien Neon, migrasi, seed
│   ├── auth/           # Konfigurasi better-auth (server & client)
│   ├── core/           # Logika domain murni + skema Zod bersama
│   ├── design-system/  # Sumber utama UI: token, globals.css, komponen shadcn/ui
│   ├── data/           # Setup TanStack Query/Form/Table
│   ├── payments/       # Stripe
│   ├── email/          # Resend
│   ├── storage/        # Cloudflare R2
│   ├── analytics/      # GA + PostHog
│   ├── observability/  # Sentry + logging + BetterStack
│   ├── seo/            # Metadata, sitemap, JSON-LD
│   └── typescript-config/ # Preset tsconfig bersama (base, react)
├── CLAUDE.md       # Aturan proyek untuk AI agent
├── DESIGN.md       # Aturan tampilan & token UI
└── AGENTS.md       # Panduan Turborepo (dikelola otomatis oleh turbo)
```

Paket internal memakai scope `@bermula/*` (mis. `@bermula/db`) dan dirujuk antar-paket
dengan `"workspace:*"`. Dependensi mengalir satu arah: `apps/*` → `packages/*`.

---

## Prasyarat

- **Bun** (package manager & test runner) — lihat https://bun.sh
- **Node.js 20+** (untuk sebagian tooling)
- **Wrangler** (CLI Cloudflare) — ikut terpasang sebagai dependensi
- Akun layanan: **Cloudflare**, **Neon**, **Stripe**, **Resend**
  (serta PostHog/Sentry/BetterStack bila mengaktifkan analitik & observability)

---

## Mulai Cepat

```bash
# 1. Pasang dependensi
bun install

# 2. Siapkan environment variable
#    Salin tiap file contoh ke file lokal yang dibaca wrangler/Vite.
#    Setiap app/paket yang butuh env punya file contohnya sendiri.
#    Contoh untuk apps/api:
cp apps/api/.dev.vars.example apps/api/.dev.vars
#    lalu isi nilainya (lihat "Environment Variable" di bawah).

# 3. Siapkan database (buat & terapkan migrasi, lalu seed opsional)
bun run db:generate
bun run db:migrate
bun run db:seed        # jika tersedia

# 4. Jalankan semua app dalam mode development
bun run dev
```

Setelah `bun run dev` berjalan:

- Aplikasi utama dan situs marketing tersedia di port lokalnya masing-masing
  (lihat output terminal).
- Dokumentasi API interaktif: buka **`/docs`** pada server `apps/api`.

---

## Environment Variable

Setiap variabel didefinisikan di dua tempat yang harus selalu sinkron: file contoh
(`.env.example` / `.dev.vars.example`) di tiap app/paket, dan skema **t3-env** di
`packages/env`. Env dibaca lewat objek t3-env yang tervalidasi — jangan mengakses
`process.env`/`import.meta.env` langsung.

- **Development:** salin file contoh ke `.dev.vars` (dibaca Wrangler/Vite di lokal).
- **Produksi (Cloudflare):** setel secret dengan `wrangler secret put <NAMA>` per app.
- Variabel sisi-klien React Router wajib berawalan `VITE_` dan tidak boleh berisi secret.
- Jangan pernah commit secret. Hanya file `*.example` yang masuk ke repo.

---

## Perintah Umum

| Perintah                        | Fungsi                                           |
| ------------------------------- | ------------------------------------------------ |
| `bun install`                   | Pasang dependensi                                |
| `bun run dev`                   | Jalankan semua app (Turborepo)                   |
| `bun run build`                 | Build semua app                                  |
| `bun run check-types`           | Type-check seluruh monorepo                      |
| `bun run check` / `bun run fix` | Lint & format via Ultracite                      |
| `bun run test`                  | Jalankan unit test (Vitest)                      |
| `bun run db:generate`           | Buat file migrasi Drizzle                        |
| `bun run db:migrate`            | Terapkan migrasi (lokal/dev)                     |
| `bun run db:studio`             | Buka Drizzle Studio                              |
| `bun run deploy`                | Deploy app ke Cloudflare (per app, via Wrangler) |

---

## Deploy

Setiap app di `apps/` adalah Worker Cloudflare terpisah dengan `wrangler.jsonc`-nya
sendiri, sehingga bisa dideploy independen.

1. Pastikan Wrangler sudah terautentikasi ke akun Cloudflare-mu.
2. Setel semua secret produksi dengan `wrangler secret put` untuk tiap app.
3. Siapkan binding (database Neon, bucket R2) sesuai `wrangler.jsonc`.
4. Jalankan deploy (`bun run deploy`, atau `wrangler deploy` di folder app).

Untuk autentikasi lintas-origin, tempatkan app dan api pada subdomain dari satu
domain induk (mis. `app.domain.com` dan `api.domain.com`) dan isi variabel URL/CORS
yang relevan — detailnya ada di `CLAUDE.md`.

---

## Dokumen Pendamping

- **`CLAUDE.md`** — aturan pengembangan lengkap (arsitektur, manajemen dependensi,
  konvensi, keamanan, definisi selesai) untuk dipakai AI agent maupun developer.
- **`DESIGN.md`** — sumber kebenaran tampilan: token warna, tipografi, dark mode,
  dan `globals.css` kanonik.
- **`AGENTS.md`** — panduan Turborepo (dikelola otomatis oleh `turbo`; jangan diedit manual).

---

## Lisensi

{{LISENSI}} — sesuaikan sebelum rilis.
