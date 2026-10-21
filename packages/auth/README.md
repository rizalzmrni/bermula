# @bermula/auth

Konfigurasi better-auth. Handler dipasang di `apps/api` (`/api/auth/*`);
apps/app & apps/web hanya memakai entry client.

| Entry                  | Isi                                                                  | Dipakai oleh           |
| ---------------------- | -------------------------------------------------------------------- | ---------------------- |
| `@bermula/auth/server` | `createAuth(options)` → instance better-auth; tipe `Auth`, `Session` | `apps/api`             |
| `@bermula/auth/client` | `createAuthClient({ baseURL, fetch? })` → klien vanilla + plugin org | `apps/app`, `apps/web` |

## Yang dikonfigurasi

- **Email + password**, wajib verifikasi email; reset password mencabut semua
  sesi lain. Email dikirim di latar lewat `waitUntil` (respons tidak menunggu
  penyedia email dan tidak membocorkan email terdaftar lewat waktu respons).
- **Google OAuth**, aktif hanya bila `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
  diisi.
- **Plugin organization** (scoping data per-organisasi). Undangan berlaku 48
  jam dan mewajibkan email penerima terverifikasi. Link undangan:
  `${APP_URL}/accept-invitation/:id`.
- **Sesi** 7 hari, diperpanjang per 1 hari; cookie cache 5 menit.
- **ID** berupa UUID (`advanced.database.generateId: "uuid"`).
- **Cookie lintas subdomain** aktif bila `AUTH_COOKIE_DOMAIN` diisi.
- **IP klien** hanya dari `cf-connecting-ip`.
- **Rate limit bawaan dimatikan**: penyimpanannya di memori isolate. Pembatasan
  dilakukan binding Rate Limiting di `apps/api`.

## Pemakaian di apps/api

```ts
const auth = createAuth({
  db: createDb({ databaseUrl: env.DATABASE_URL }),
  emails, // fungsi kirim dari packages/email
  env, // hasil createApiEnv(c.env)
  logger,
  waitUntil: (promise) => c.executionCtx.waitUntil(promise),
});
```

Instance dibuat **per request**, karena env dan `waitUntil` baru ada saat request.

## Database

Adapter: `@better-auth/drizzle-adapter/relations-v2` (untuk `defineRelations`
Drizzle v1), tanpa transaksi karena `createDb` memakai `neon-http`.
Akibatnya operasi multi-langkah (mis. buat organisasi + anggota pertama) tidak
atomik. Tabel auth **belum dibuat**; setelah dibuat di
`packages/db/src/schema/auth.ts`, tabel didaftarkan di `relations.ts` agar
adapter menemukannya lewat `db._.relations`.
