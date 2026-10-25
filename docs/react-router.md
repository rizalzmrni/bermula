# React Router di Cloudflare Workers (apps/app & apps/web)

Diimpor oleh `apps/app/CLAUDE.md` dan `apps/web/CLAUDE.md`.

## Boundary client/server

- Ambil data di **loader**, ubah data di **action** atau `useMutation`.
- Loader/action berjalan di Worker; komponen terkirim ke browser. Jangan menaruh
  secret, akses DB, atau impor server-only di modul yang ikut ke bundle klien.
- Env server hanya lewat `context.cloudflare.env` di loader/action, bukan dari
  modul top-level. Env klien hanya `VITE_*` lewat `packages/env`.
- Satu file per route di `app/routes/`; route tipis, hanya menyusun fitur dari
  `app/features/`.

## Memanggil api: Service Binding

- `wrangler.jsonc` mendeklarasikan service binding `API` ke Worker `api`.
- Saat SSR (loader/action), klien `hc<AppType>` memakai `fetch` dari
  `context.cloudflare.env.API`, bukan URL publik. Alasan: tanpa hop jaringan
  publik dan tanpa masalah CORS.
- Teruskan header `cookie` dari `request` asli agar sesi pengguna terbawa.
- Di browser, klien `hc<AppType>` memakai `API_URL` publik dengan
  `credentials: "include"`.
- Buat satu factory di `app/lib/api-client.ts` yang menerima mode (server dengan
  binding + request, atau browser); jangan membuat klien di tempat lain.
- Cek sintaks service binding & cara memanggilnya di dokumentasi resmi
  Cloudflare dan `@cloudflare/vite-plugin` versi terpasang.

## Auth gate

- Loader halaman terproteksi memanggil `/api/auth/get-session` lewat Service
  Binding. Tanpa sesi → `redirect` ke halaman login (dengan `redirectTo`).
- `apps/app`/`apps/web` **tidak** mengakses DB dan tidak mengimpor konfigurasi
  server better-auth; hanya klien better-auth (`packages/auth` entry client).
- Gunakan satu helper `requireSession({ request, context })` agar tidak
  diulang di setiap route.

## Pola data: loader prefetch + TanStack Query

1. Loader membuat/mengambil QueryClient per request, memanggil
   `queryClient.ensureQueryData({ queryKey, queryFn })` dengan `queryFn` yang
   sama dengan yang dipakai di komponen.
2. Loader mengembalikan state hasil `dehydrate(queryClient)`.
3. Root/route membungkus dengan `HydrationBoundary`; komponen memakai
   `useQuery` dengan query key yang sama, sehingga tidak ada fetch ganda.
4. Mutasi: `useMutation` + `queryClient.invalidateQueries` dengan key dari
   `features/<fitur>/query-keys.ts`.

- QueryClient server dibuat **per request** (jangan dibagi antar-request).
- Query key dan `queryFn` didefinisikan sekali per fitur, di
  `features/<fitur>/queries.ts` dan `query-keys.ts`.

## Type-check

- `react-router typegen` harus jalan sebelum `tsc --noEmit`; task `check-types`
  di `turbo.json` bergantung pada `typegen`.
- Pakai tipe `Route.LoaderArgs`, `Route.ComponentProps`, dll. dari
  `./+types/<route>`; jangan menulis tipe loader manual.

## SEO (apps/web)

- Metadata lewat `meta` export dan helper dari `packages/seo`.
- Halaman marketing tidak butuh sesi; jangan memanggil auth gate kecuali halaman
  tersebut menampilkan status login.
