# @bermula/api

API Hono di Cloudflare Workers: handler better-auth, endpoint aplikasi yang
terdokumentasi OpenAPI 3.1, dan dokumentasi Scalar.

## Menjalankan

```sh
cp .dev.vars.example .dev.vars   # isi nilai wajib (lihat komentar di file)
bun run dev                      # wrangler dev → http://localhost:8787
```

| Path                            | Isi                                                      |
| ------------------------------- | -------------------------------------------------------- |
| `GET /health`                   | Cek status (tanpa DB)                                    |
| `GET, POST /api/auth/*`         | better-auth (sign-up, sign-in, organisasi, 2FA, admin)   |
| `GET /api/me`                   | Pengguna login + organisasi aktif                        |
| `/api/images`, `/api/documents` | Upload, daftar, unduh, hapus file (lihat di bawah)       |
| `/api/billing/*`                | Langganan, Stripe Checkout & Portal (lihat di bawah)     |
| `POST /api/webhooks/stripe`     | Webhook Stripe (signature, tanpa sesi & rate limit)      |
| `GET /docs`, `/openapi.json`    | Scalar & dokumen OpenAPI (hanya `API_DOCS_ENABLED=true`) |

`/openapi.json` juga memuat endpoint better-auth (tag `Auth*`, model `Auth*`),
digabung dari `auth.api.generateOpenAPISchema()` di `src/lib/auth-openapi.ts`.
`/api/auth/open-api/*` ikut dijaga `API_DOCS_ENABLED`; halaman `/api/auth/reference`
bawaan plugin dimatikan.

Perubahan pada `.dev.vars` baru terbaca setelah `wrangler dev` di-restart.

## Upload file

Byte file dikirim browser langsung ke R2 lewat presigned URL, tidak lewat
Worker. Image dan dokumen punya endpoint, kebijakan (`UPLOAD_POLICIES` di
`@bermula/core/files`), dan prefix R2 sendiri, tetapi satu tabel `storage_files`.

1. `POST /api/images` `{ fileName, contentType, size }` → `{ file, upload }`.
2. `PUT upload.url` dengan body file dan header `content-type` dari
   `upload.headers` (URL berlaku 10 menit).
3. `POST /api/images/{id}/complete` → status `uploaded` setelah objek dicek ada.

`GET /api/images?cursor&limit` (paginasi keyset), `GET /api/images/{id}/download`
(URL 5 menit; image `inline`, dokumen `attachment`), `DELETE /api/images/{id}`
(pengunggah atau owner/admin). Semua endpoint dibatasi organisasi aktif.

Bucket R2 harus privat dan punya aturan CORS untuk origin app (`PUT`, `GET`,
header `content-type`).

## Tagihan (Stripe)

Pembayar = organisasi. Opsional: tanpa `STRIPE_SECRET_KEY` +
`STRIPE_WEBHOOK_SECRET`, `GET /api/billing/subscription` tetap jalan
(`billingEnabled: false`, paket `free`) dan endpoint lain membalas 503.

- `GET /api/billing/subscription` — paket berlaku + langganan, dibaca dari
  Postgres (semua anggota).
- `POST /api/billing/checkout-sessions` `{ plan }` → `{ url }` Stripe Checkout
  (owner/admin; 409 bila sudah berlangganan). Customer Stripe dibuat sekali per
  organisasi (`billing_customers`). Price dicari lewat `lookup_key`
  `<plan>_monthly`.
- `POST /api/billing/portal-sessions` → `{ url }` Billing Portal (owner/admin).
- `POST /api/webhooks/stripe` — verifikasi signature atas body mentah, lewati
  `event.id` yang sudah tercatat (`billing_webhook_events`), ambil ulang
  subscription dari Stripe lalu upsert `billing_subscriptions`. Diproses
  sebelum membalas: bila gagal → 500 → Stripe mengirim ulang.

Uji lokal (Stripe test mode):

1. Buat Product + Price bulanan dengan lookup key `pro_monthly` dan
   `business_monthly` (harga samakan dengan `PLANS` di `@bermula/core/plans`).
2. Aktifkan Customer Portal di dashboard (Settings → Billing → Customer portal).
3. `stripe listen --forward-to localhost:8787/api/webhooks/stripe`, salin
   `whsec_...` ke `STRIPE_WEBHOOK_SECRET` di `.dev.vars`, restart `wrangler dev`.
4. Bayar dengan kartu uji `4242 4242 4242 4242` dari `/settings/billing` di app.

Produksi: buat endpoint webhook di dashboard Stripe dengan event
`checkout.session.completed` dan `customer.subscription.*`.

## Cron (pembersihan storage)

`src/scheduled.ts` dijalankan Cron Trigger harian (`0 20 * * *` UTC = 03.00 WIB,
`triggers.crons` di `wrangler.jsonc`) dan memanggil
`services/storage-cleanup.ts`:

- baris `storage_files` `pending` berumur >24 jam dihapus beserta objeknya;
- objek di prefix `images/` & `documents/` tanpa baris dan berumur >24 jam
  dihapus (mis. sisa organisasi yang dihapus).

Maksimal 500 baris + 500 objek per jalan; sisanya dibereskan jalan berikutnya.
Uji lokal: `bunx wrangler dev --test-scheduled`, lalu
`curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+20+*+*+*&time=<epoch ms>"`
(`time` dalam **milidetik**; geser ke masa depan agar objek baru ikut terhitung).
Perintah ini menghapus data sungguhan di bucket & database yang dipakai `.dev.vars`.

## Struktur

```
src/
├── index.ts          # Rangkaian middleware + route, ekspor AppType, handler fetch & scheduled
├── scheduled.ts      # Cron Trigger: pembersihan storage
├── openapi.ts        # Security scheme sesi, /openapi.json, /docs
├── types.ts          # Bindings & variabel context
├── lib/              # errors, router (OpenAPIHono), runtime (logger/storage/PostHog bersama), auth-openapi
├── middleware/       # context per request, cors, rate-limit, require-auth
├── routes/           # HTTP + validasi + dokumentasi
└── services/         # logika bisnis & otorisasi
```

Urutan middleware: `context` (env, logger, db, auth) → `cors` → rate limit
(`/api/auth/*` 10/menit, `/api/*` 100/menit per IP, kecuali `/api/webhooks/*`) → route.

## Perintah

| Perintah              | Fungsi                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `bun run typegen`     | `wrangler types` → `worker-configuration.d.ts` (tidak di-commit) |
| `bun run check-types` | Type-check                                                       |
| `bun run test`        | Vitest di workerd (`@cloudflare/vitest-plugin`)                  |
| `bun run deploy`      | `wrangler deploy`                                                |

## Produksi

- Secret lewat `wrangler secret put <NAMA>` (lihat `.dev.vars.example`).
- `nodejs_compat` wajib: better-auth memakai `AsyncLocalStorage`.
- Admin pertama dipromosikan manual: `update auth_users set role = 'admin' where email = '...'`.
