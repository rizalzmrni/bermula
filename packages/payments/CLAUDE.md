# packages/payments — Polar

Aturan root `CLAUDE.md` tetap berlaku. Semua pekerjaan di paket ini termasuk
tugas **berisiko**: tulis rencana dan tunggu persetujuan.

> Pendekatan integrasi (diputuskan 2026-10-27): SDK `@polar-sh/sdk` langsung
> di balik `PaymentGateway`, **bukan** plugin `@polar-sh/better-auth`.

## Model

- Polar adalah **Merchant of Record**: Polar yang menjual ke pelanggan dan
  mengurus pajak penjualan internasional; kita menerima payout.
- **Pembayar = organisasi**, bukan pengguna. Hanya owner/admin organisasi yang
  boleh membuka Checkout atau Customer Portal; otorisasi dicek di server, tidak
  pernah mempercayai ID organisasi dari klien tanpa memeriksa keanggotaan.
- Checkout dan Customer Portal memakai halaman Polar; tidak ada form kartu di app.
- Harga multi-mata uang (IDR untuk Indonesia, USD default) diatur per produk di
  Polar. Mata uang dipilih Polar dari lokasi pelanggan, jadi saat membuat
  checkout dari server, teruskan IP pelanggan asli (`cf-connecting-ip`), bukan
  IP Worker.

## Klien

- Pakai `@polar-sh/sdk` dengan klien core (`createPolarCore`) dan fungsi
  standalone per operasi dari `@polar-sh/sdk/<versi-api>/services/<layanan>`,
  agar bundle Worker tetap kecil. Versi API dipilih lewat path impor (saat ini
  `2026-10`); field request/response memakai `snake_case`. Cek signature di
  type definition paket terpasang (paket juga membawa skill
  `.agents/skills/polar-typescript-sdk`), jangan menebak.
- Buat klien **per request** dari secret di binding (`c.env`), bukan saat modul
  dimuat.
- Lingkungan `sandbox` dan `production` terpisah total (token, produk, webhook).
  Pilih lewat env, jangan hardcode.
- Secret (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`) hanya di server.

## Webhook

- Polar memakai format **Standard Webhooks** (header `webhook-id`,
  `webhook-timestamp`, `webhook-signature`). Verifikasi dengan
  `webhooks.validateEvent` dari SDK; jangan menulis verifikasi sendiri.
- Verifikasi memakai **body mentah** (`await c.req.text()`). Jangan parse JSON
  sebelum verifikasi, karena signature dihitung dari byte asli.
- Route webhook tidak memakai middleware auth sesi, validasi body Zod, atau rate
  limit per IP; keamanannya dari signature. Tetap dokumentasikan di OpenAPI.
- Signature salah → 403. Tipe event yang tidak dikenal → 2xx agar tidak dikirim
  ulang.
- Handler idempoten: Polar mengirim ulang pengiriman yang gagal dengan header
  `webhook-id` yang sama; catat ID itu setelah sync berhasil. Jangan
  mengandalkan urutan event: upsert subscription dari payload hanya bila
  `modified_at` lebih baru dari yang tersimpan.
- Polar menyarankan balasan < 2 detik dan menonaktifkan endpoint setelah
  kegagalan beruntun. Pekerjaan di webhook hanya query DB, tanpa panggilan ke
  API Polar.
- Organisasi dipetakan ke customer Polar lewat `external_id` (= ID
  organisasi, diisi api saat Checkout); tetap cek ke DB bahwa organisasinya ada.
- Data langganan disimpan di Postgres (sumber kebenaran untuk otorisasi fitur),
  disinkronkan dari webhook; jangan memanggil Polar di setiap request untuk
  mengecek status.

## Testing

- Test memakai payload contoh + signature yang dibuat di test (dengan secret
  test), tanpa memanggil API Polar nyata.
- Uji manual memakai **Polar Sandbox**. Polar tidak bisa memanggil `localhost`,
  jadi webhook lokal butuh tunnel ke `wrangler dev`; tulis langkahnya di laporan.
