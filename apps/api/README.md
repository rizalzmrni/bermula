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
| `/api/billing/*`                | Langganan, Checkout & Portal (lihat di bawah)            |
| `POST /api/webhooks/polar`      | Webhook Polar (Standard Webhooks, tanpa sesi)            |
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

## Tagihan (Polar)

Penyedia: **Polar** (Merchant of Record). Pembayar = organisasi. Opsional: tanpa
`POLAR_ACCESS_TOKEN` + `POLAR_WEBHOOK_SECRET`, `GET /api/billing/subscription`
tetap jalan (`billingEnabled: false`, paket `free`) dan endpoint lain membalas 503.

- `GET /api/billing/subscription` — paket berlaku + langganan, dibaca dari
  Postgres (semua anggota).
- `POST /api/billing/checkout-sessions` `{ plan }` → `{ url }` Polar Checkout
  (owner/admin; 409 bila sudah berlangganan). Customer Polar ditautkan lewat
  `external_customer_id` = ID organisasi; IP pengguna (`cf-connecting-ip`)
  diteruskan untuk mata uang & pajak.
- `POST /api/billing/portal-sessions` → `{ url }` Customer Portal
  (owner/admin; 409 sebelum ada langganan).
- `POST /api/webhooks/polar` — verifikasi Standard Webhooks atas body mentah
  (signature/timestamp salah → 403), idempoten per `webhook-id`, upsert
  `billing_subscriptions` dari payload hanya bila `modified_at` lebih baru.
  Tipe event yang tidak dikenal SDK dibalas 200. Diproses sebelum membalas:
  bila gagal → 5xx → Polar mengirim ulang.

Uji lokal dengan Polar Sandbox:

1. Di https://sandbox.polar.sh buat organisasi, lalu **Organization Access
   Token** dengan scope `products:read`, `checkouts:write`,
   `customer_sessions:write` → `POLAR_ACCESS_TOKEN` (biarkan `POLAR_SERVER`
   kosong = `sandbox`). Bila pembuatan Checkout ditolak 401/403, tambahkan
   `customers:write`.
2. Buat produk langganan bulanan untuk paket berbayar di `PLANS`
   (`@bermula/core/plans`) dengan metadata `plan` = `pro` / `business`.
   Samakan harga dengan `monthlyPrice` (tampilan di app/web).
3. Polar tidak bisa memanggil `localhost`: jalankan tunnel ke `wrangler dev`
   (mis. `cloudflared tunnel --url http://localhost:8787`), daftarkan
   `<url-tunnel>/api/webhooks/polar` di Settings → Webhooks (format Raw, event
   `subscription.*`), lalu salin secret-nya ke `POLAR_WEBHOOK_SECRET`.
4. Restart `wrangler dev` (dan `apps/app`), bayar dengan kartu uji sandbox dari
   `/settings/billing`, lalu cek paket berubah setelah webhook tiba.

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
