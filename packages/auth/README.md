# @bermula/auth

Konfigurasi better-auth. Handler dipasang di `apps/api` (`/api/auth/*`);
apps/app & apps/web hanya memakai entry client.

| Entry                  | Isi                                                                              | Dipakai oleh           |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------------- |
| `@bermula/auth/server` | `createAuth(options)` → instance better-auth; tipe `Auth`, `Session`             | `apps/api`             |
| `@bermula/auth/client` | `createAuthClient({ baseURL, fetch? })` → klien vanilla + plugin admin, org, 2FA | `apps/app`, `apps/web` |

## Yang dikonfigurasi

- **Email + password**, wajib verifikasi email; reset password mencabut semua
  sesi lain. Email dikirim di latar lewat `waitUntil` (respons tidak menunggu
  penyedia email dan tidak membocorkan email terdaftar lewat waktu respons).
- **Google OAuth**, aktif hanya bila `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
  diisi.
- **Plugin organization** (scoping data per-organisasi). Undangan berlaku 48
  jam dan mewajibkan email penerima terverifikasi. Link undangan:
  `${APP_URL}/accept-invitation/:id`.
- **Plugin admin**: role level aplikasi di `auth_users.role` (`user` default,
  `admin` untuk pengelola), ban pengguna, dan impersonate (`auth_sessions.impersonated_by`).
  Terpisah dari role owner/admin/member di organisasi.
- **Plugin twoFactor**: TOTP (aplikasi authenticator, issuer = `APP_NAME` dari
  `@bermula/core/brand`) + backup code, disimpan terenkripsi di
  `auth_two_factors`. OTP via email belum diaktifkan.
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

## Organisasi pribadi

Setiap pengguna otomatis punya satu **organisasi pribadi** (`isPersonal: true`),
sehingga semua data selalu ter-scope ke organisasi, baik di aplikasi personal
maupun aplikasi tim. Aplikasi yang tidak butuh fitur tim cukup menyembunyikan
UI organisasi.

- Dibuat di hook `databaseHooks.session.create.before` saat sesi pertama
  (pengguna email baru mendapat sesi setelah verifikasi), sekaligus mengisi
  `activeOrganizationId` di setiap sesi baru dengan organisasi pertama pengguna.
- Organisasi + keanggotaan owner ditulis dalam satu `db.batch` (atomik di
  neon-http). Slug `personal-<userId>` unik, jadi login bersamaan tidak
  menghasilkan dua organisasi pribadi.
- Tidak bisa dihapus (`beforeDeleteOrganization`) dan `isPersonal` tidak bisa
  diisi dari klien (`input: false`).

## Database

Tabel di `@bermula/db/schema/users` dan `@bermula/db/schema/auth` (nama
`auth_*`, jamak; adapter `usePlural: true`). Adapter:
`@better-auth/drizzle-adapter/relations-v2` (untuk `defineRelations` Drizzle
v1), tanpa transaksi karena `createDb` memakai `neon-http`. Operasi
multi-langkah bawaan better-auth (mis. buat organisasi tim + anggota pertama)
tidak atomik; pembuatan organisasi pribadi memakai `db.batch` sehingga atomik.
Adapter menemukan tabel lewat kunci `relations.ts` di `packages/db`.
