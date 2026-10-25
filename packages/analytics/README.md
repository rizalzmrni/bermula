# @bermula/analytics

Analitik browser dengan persetujuan cookie. Isinya Google Analytics 4 (`gtag.js`,
tanpa library) untuk `apps/web`, dan PostHog (`posthog-js`) untuk `apps/web` dan
`apps/app`. **Tidak ada pelacak yang dimuat sebelum pengunjung menekan "Terima"**.
Analitik server (PostHog lewat HTTP capture API) tetap ada di
`packages/observability`.

## Cara kerja persetujuan

- Pilihan disimpan di cookie `analytics_consent` (`granted` | `denied`, 6 bulan,
  `SameSite=Lax`, `Secure` di https). Cookie ditulis server lewat `Set-Cookie`
  dari route action `/consent`, jadi app tidak pernah menulis `document.cookie`.
- Root loader membaca cookie (`readConsent`). Akibatnya banner sudah ada di HTML
  hasil SSR dan tidak berkedip, dan pelacak hanya dimuat bila `granted`.
- Tombol Tolak dan Terima punya bobot visual yang sama: menolak harus semudah
  menerima (GDPR/UU PDP).
- Form tetap jalan tanpa JavaScript. Request navigasi
  (`Sec-Fetch-Mode: navigate`) di-redirect kembali ke `redirectTo`, dan path-nya
  dibatasi ke path lokal.
- POST lintas-origin ditolak dengan 403.
- Mencabut persetujuan menghentikan pelacak tanpa memuat ulang halaman:
  - GA: flag `ga-disable-<ID>` dipasang.
  - PostHog: `reset()` lalu `opt_out_capturing()`.
- Cookie `_ga` yang sudah tertulis tidak dihapus (hanya dimatikan).

## Ekspor

| Entri                  | Isi                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `./consent`            | `readConsent`, `serializeConsentCookie`, `handleConsentAction` (untuk route action), konstanta `CONSENT`                     |
| `./analytics`          | `Analytics`: `AnalyticsProvider` + `ConsentBanner`; tidak merender banner bila tidak ada layanan yang dikonfigurasi          |
| `./analytics-provider` | `AnalyticsProvider`, `useAnalytics()` (`identify`, `reset`; no-op tanpa persetujuan), `AnalyticsIdentify`, `toPostHogConfig` |
| `./consent-banner`     | `ConsentBanner`                                                                                                              |
| `./consent-settings`   | `ConsentSettings`, untuk halaman pengaturan cookie (ubah/cabut pilihan)                                                      |
| `./consent-form`       | `ConsentButtons`, `useConsentChoice`, `CONSENT_ACTION_PATH`                                                                  |

## Memasang di app

```ts
// routes/consent.ts: route top-level di path "/consent"
export const loader = () => redirect("/");
export const action = ({ request }: Route.ActionArgs) =>
  handleConsentAction(request);
```

```tsx
// root.tsx
export const loader = ({ request }: Route.LoaderArgs) => ({
  consent: readConsent(request.headers.get("Cookie")),
});

<Analytics
  config={getAnalyticsConfig()}
  consent={useConsent()}
  privacyHref="/privasi"
>
  {children}
</Analytics>;
```

- Page view:
  - GA dikirim manual per navigasi (`send_page_view: false`).
  - PostHog memakai `capture_pageview: "history_change"` dari `defaults`.
  - Di dev, StrictMode menjalankan effect dua kali, sehingga page view pertama GA
    tercatat ganda. Ini tidak terjadi di build produksi.
- Pengguna login (apps/app): `<AnalyticsIdentify userId organization />`
  memanggil `identify` dan juga `group("organization", id)`. Saat logout, panggil
  `useAnalytics().reset()` sebelum submit.

## Env (client, semuanya opsional)

| Variabel                                           | App       | Catatan                                        |
| -------------------------------------------------- | --------- | ---------------------------------------------- |
| `VITE_GA_MEASUREMENT_ID`                           | web       | Format `G-XXXX`; kosong = GA mati              |
| `VITE_POSTHOG_PROJECT_TOKEN` + `VITE_POSTHOG_HOST` | web & app | Wajib diisi berpasangan; kosong = PostHog mati |

Jika semua variabel di atas kosong, banner tidak tampil.

## Test

`bun run test` (Vitest + happy-dom, script eksternal tidak dimuat). `posthog-js`
di-mock. `consent.test.ts` berjalan di lingkungan Node, karena `Request` milik
happy-dom membuang header `Origin` dan `Sec-Fetch-Mode`.
