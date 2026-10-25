# @bermula/email

Template React Email + fungsi kirim. `apps/api` yang memanggil fungsi kirim;
`apps/email` hanya server preview yang membaca template dari sini (`bun run dev`
di sana, http://localhost:3000).

| Entry                                 | Isi                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `@bermula/email/sender`               | `createEmailSender({ from, transport })` → fungsi kirim per jenis email    |
| `@bermula/email/resend-transport`     | `createResendTransport({ apiKey })` → transport Resend                     |
| `@bermula/email/transport`            | Tipe `EmailTransport` & `EmailMessage` (untuk transport lain/test)         |
| `@bermula/email/templates/<template>` | Komponen template + subjek + `PreviewProps` (default export untuk preview) |

## Template

| Template                  | Fungsi kirim                      | Dipicu oleh                 |
| ------------------------- | --------------------------------- | --------------------------- |
| `verify-email`            | `sendVerificationEmail`           | Sign-up email + password    |
| `reset-password`          | `sendResetPasswordEmail`          | Lupa kata sandi             |
| `organization-invitation` | `sendOrganizationInvitationEmail` | Undangan anggota organisasi |

Bentuk fungsi kirim cocok dengan `AuthEmailSenders` di `packages/auth`.

## Pemakaian di apps/api

```ts
const emails = createEmailSender({
  from: env.EMAIL_FROM,
  transport: createResendTransport({ apiKey: env.RESEND_API_KEY }),
});

const auth = createAuth({ db, emails, env, logger, waitUntil });
```

## Aturan

- **Teks UI berbahasa Indonesia**; nama produk dari `APP_NAME` di `@bermula/core/brand`.
- **Gaya inline**, bukan Tailwind: klien email tidak mendukung CSS variable,
  `oklch`, flexbox, maupun media query. Warna diambil dari token
  `DESIGN.md` yang dikonversi ke hex di `src/brand.ts` (satu-satunya tempat
  hex boleh ditulis); perbarui bila token berubah. Hanya mode terang.
- Setiap email punya tombol **dan** URL teks sebagai cadangan, plus versi teks
  polos (`toPlainText`).
- Template menerima data yang sudah jadi (nama, URL); tidak membaca env atau DB.
- Render berjalan di Workers lewat kondisi ekspor `workerd` milik
  `@react-email/render`. Kegagalan kirim dilempar sebagai `Error`; `packages/auth`
  yang mencatatnya ke logger.

## Testing

`bun run test` berjalan di workerd (`@cloudflare/vitest-plugin`, konfigurasi
`wrangler.jsonc` khusus test dengan compatibility date & flag `apps/api`), jadi
kondisi ekspor `workerd` `@react-email/render` dan SDK Resend ikut teruji.
Bundling esbuild milik `wrangler dev`/`deploy` **tidak** tercakup (Vitest memakai
pipeline Vite); bug semacam `render2 is not a function` hanya muncul di sana, jadi
setelah mengubah impor paket ini cek sekali lewat `wrangler dev` di `apps/api`.

## Env (di apps/api)

`RESEND_API_KEY` dan `EMAIL_FROM` (lihat `apps/api/.dev.vars.example`). Untuk dev
tanpa domain terverifikasi, `EMAIL_FROM=onboarding@resend.dev` hanya bisa
mengirim ke email pemilik akun Resend.
