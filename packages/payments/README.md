# @bermula/payments

Integrasi pembayaran untuk `apps/api`: klien, gateway, verifikasi webhook, dan
pemetaan subscription. Tanpa DB; penyimpanan & otorisasi ada di
`apps/api/src/services/billing.ts`.

> **Penyedia: Polar** (Merchant of Record), menggantikan Stripe (keputusan
> 2026-10-27, lihat `STATUS.md`). Migrasi kode **belum dikerjakan**: tabel di
> bawah masih menggambarkan implementasi Stripe yang ada sekarang (SDK `stripe`
> 23, API `2026-09-30`) dan akan diganti saat migrasi. Aturan Polar ada di
> `CLAUDE.md` paket ini.

| Entry                            | Isi                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `@bermula/payments/client`       | `createStripeClient(secretKey)`: per request, HTTP client `fetch` (Workers)            |
| `@bermula/payments/gateway`      | `PaymentGateway` (interface sempit yang dipakai service) + `createStripeGateway`       |
| `@bermula/payments/webhook`      | `verifyWebhookEvent` (`constructEventAsync` + Web Crypto); `null` bila signature salah |
| `@bermula/payments/subscription` | `toSubscriptionSnapshot`, `getSubscriptionIdFromEvent`, `ORGANIZATION_METADATA_KEY`    |
| `@bermula/payments/testing`      | `signWebhookPayload`, `createTestEvent`, `TEST_WEBHOOK_SECRET` (hanya untuk test)      |

## Keputusan (implementasi Stripe saat ini)

- **Paket di `@bermula/core/plans`**, harga yang ditagih di Stripe. Price
  dicari lewat `lookup_key` `<plan>_monthly`, jadi ID Price tidak perlu
  disimpan di env per lingkungan.
- **Service bergantung pada `PaymentGateway`**, bukan SDK Stripe: mudah
  dipalsukan di test PGlite dan bisa diganti penyedia lain.
- **Webhook mengambil ulang subscription** dari Stripe, bukan memakai payload
  event, sehingga event yang tiba tidak berurutan tetap menghasilkan state terbaru.
- `current_period_end` dibaca dari item subscription (sejak API `2025-03-31`).
- `cancelAtPeriodEnd` juga `true` bila `cancel_at` terisi (pembatalan
  terjadwal dari Portal).

## Testing

`bun run test` berjalan di workerd. Event dibuat dari payload contoh dan
ditandatangani dengan `TEST_WEBHOOK_SECRET`, lalu diverifikasi lewat jalur yang
sama dengan produksi; tanpa memanggil API Stripe.

## Env (di apps/api)

Saat ini `STRIPE_SECRET_KEY` (`sk_`/`rk_`) dan `STRIPE_WEBHOOK_SECRET`
(`whsec_`), pasangan opsional. Setelah migrasi diganti `POLAR_ACCESS_TOKEN`,
`POLAR_WEBHOOK_SECRET`, dan pemilih lingkungan sandbox/production (nama final
ditetapkan saat implementasi). Lihat `apps/api/.dev.vars.example` dan
`apps/api/README.md`.
