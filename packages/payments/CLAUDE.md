# packages/payments — Stripe

Aturan root `CLAUDE.md` tetap berlaku. Semua pekerjaan di paket ini termasuk
tugas **berisiko**: tulis rencana dan tunggu persetujuan.

## Klien

- Buat klien Stripe **per request** dari secret di binding, dengan HTTP client
  berbasis `fetch` (`Stripe.createFetchHttpClient()`) agar cocok di Workers.
  Cek API versi terpasang di dokumentasi resmi Stripe.
- Secret (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) hanya di server; publishable
  key bila perlu di klien sebagai `VITE_STRIPE_PUBLISHABLE_KEY`.

## Webhook

- Verifikasi signature dengan **`constructEventAsync`** dan crypto provider
  Web Crypto (`Stripe.createSubtleCryptoProvider()`). Versi sinkron
  (`constructEvent`) bergantung pada crypto Node dan gagal di Workers.
- Verifikasi memakai **body mentah** (`await c.req.text()`). Jangan parse JSON
  sebelum verifikasi, karena signature dihitung dari byte asli.
- Route webhook di `apps/api` tidak memakai middleware auth sesi dan tidak
  memakai validasi body Zod; keamanannya dari signature. Tetap dokumentasikan di
  OpenAPI.
- Handler idempoten: simpan `event.id` yang sudah diproses dan abaikan duplikat
  (Stripe bisa mengirim ulang event).
- Balas 2xx secepatnya; pekerjaan lambat dijalankan dengan `waitUntil` atau
  antrean, bukan menahan respons.
- Data langganan disimpan di Postgres (sumber kebenaran untuk otorisasi fitur),
  disinkronkan dari webhook; jangan memanggil Stripe di setiap request untuk
  mengecek status.

## Testing

- Test memakai payload contoh + signature yang dibuat di test (dengan secret
  test), tanpa memanggil API Stripe nyata.
- Gunakan Stripe test mode dan Stripe CLI untuk uji manual lokal; tulis
  langkahnya di laporan.
