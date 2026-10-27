# @bermula/payments

Integrasi pembayaran **Polar** (Merchant of Record) untuk `apps/api`: klien,
gateway, verifikasi webhook, dan pemetaan subscription. Tanpa DB; penyimpanan &
otorisasi ada di `apps/api/src/services/billing.ts`. Aturan kerja ada di
`CLAUDE.md` paket ini.

SDK: `@polar-sh/sdk` 1.x, versi API `2026-10` (path impor
`@polar-sh/sdk/2026-10`). Naikkan versi API bersama upgrade paket.

| Entry                            | Isi                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@bermula/payments/client`       | `createPolarClient({ accessToken, server })`: klien core per request, `POLAR_SERVER`              |
| `@bermula/payments/gateway`      | `PaymentGateway` (interface sempit yang dipakai service) + `createPolarGateway`                   |
| `@bermula/payments/webhook`      | `verifyWebhookEvent` (`webhooks.validateEvent` SDK) → `valid`/`invalid`/`malformed`/`unsupported` |
| `@bermula/payments/subscription` | `toSubscriptionSnapshot`, `getSubscriptionFromEvent`, `PLAN_METADATA_KEY`                         |
| `@bermula/payments/testing`      | `signWebhookPayload`, `createTestEvent`, `TEST_WEBHOOK_SECRET` (hanya untuk test)                 |

## Keputusan

- **SDK langsung di balik `PaymentGateway`** (bukan plugin `@polar-sh/better-auth`,
  keputusan 2026-10-27): otorisasi owner/admin dan scoping organisasi tetap di
  service kita, dan service mudah dipalsukan di test PGlite.
- **Organisasi = customer Polar lewat `external_id`.** Checkout dibuat dengan
  `external_customer_id` = ID organisasi; Polar membuat customer saat Checkout
  selesai. Portal dibuka dengan ID yang sama, jadi tidak ada tabel customer.
- **Paket dari metadata produk** `plan` = `pro` | `business`. ID produk tidak
  disimpan di env per lingkungan; produk yang diarsipkan diabaikan.
- **Webhook memakai payload, bukan mengambil ulang ke API.** Event
  `subscription.*` memuat subscription lengkap; upsert hanya menimpa baris bila
  `modified_at` lebih baru, sehingga event yang tiba tidak berurutan aman dan
  webhook cepat dibalas (Polar menyarankan < 2 detik).
- **Idempoten lewat header `webhook-id`** (sama untuk setiap pengiriman ulang).
- `cancelAtPeriodEnd` juga `true` bila `ends_at` terisi (pembatalan terjadwal).
- IP browser pengguna (`cf-connecting-ip`) diteruskan ke Checkout agar Polar
  memilih mata uang dan pajak yang benar.

## Testing

`bun run test` berjalan di workerd. Payload contoh ditandatangani (Standard
Webhooks, HMAC SHA-256) dengan `TEST_WEBHOOK_SECRET`, lalu diverifikasi lewat
jalur yang sama dengan produksi; tanpa memanggil API Polar.

## Env (di apps/api)

`POLAR_ACCESS_TOKEN` (`polar_oat_`, scope `products:read`, `checkouts:write`,
`customer_sessions:write`) dan `POLAR_WEBHOOK_SECRET` adalah pasangan opsional;
`POLAR_SERVER` = `sandbox` (default) | `production`. Lihat
`apps/api/.dev.vars.example` dan bagian "Tagihan" di `apps/api/README.md`.
