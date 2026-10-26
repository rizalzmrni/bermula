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
| `POST /api/webhooks/stripe`     | Webhook Stripe; diganti webhook Polar saat migrasi       |
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

> **Penyedia: Polar** (Merchant of Record), menggantikan Stripe (keputusan
> 2026-10-27). Kode di bawah ini **masih Stripe** sampai migrasi selesai; kontrak
> endpoint dan aturan otorisasi dipertahankan. Rencana dan status di `STATUS.md`.

Pembayar = organisasi. Opsional: tanpa env penyedia pembayaran,
`GET /api/billing/subscription` tetap jalan (`billingEnabled: false`, paket
`free`) dan endpoint lain membalas 503.

- `GET /api/billing/subscription` — paket berlaku + langganan, dibaca dari
  Postgres (semua anggota).
- `POST /api/billing/checkout-sessions` `{ plan }` → `{ url }` halaman Checkout
  penyedia (owner/admin; 409 bila sudah berlangganan).
- `POST /api/billing/portal-sessions` → `{ url }` portal pelanggan (owner/admin).
- Webhook — verifikasi signature atas body mentah, idempoten, ambil ulang
  langganan dari penyedia lalu upsert `billing_subscriptions`. Diproses sebelum
  membalas: bila gagal → 5xx → penyedia mengirim ulang.

Implementasi Stripe saat ini: `POST /api/webhooks/stripe`, customer Stripe
sekali per organisasi (`billing_customers`), Price dicari lewat `lookup_key`
`<plan>_monthly`.

Uji lokal dengan Polar (berlaku setelah migrasi):

1. Buat akun di **Polar Sandbox** dan Organization Access Token sandbox. Token,
   produk, dan webhook sandbox terpisah dari produksi.
2. Buat produk langganan bulanan untuk paket berbayar di `PLANS`
   (`@bermula/core/plans`), dengan harga USD (default) dan IDR.
3. Polar tidak bisa memanggil `localhost`: jalankan tunnel ke `wrangler dev`
   (port 8787), lalu daftarkan URL webhook-nya di pengaturan organisasi Polar
   sandbox dan salin secret-nya ke `.dev.vars`.
4. Bayar dengan kartu uji sandbox dari `/settings/billing` di app.

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
