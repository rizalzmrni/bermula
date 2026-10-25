# @bermula/email-preview (apps/email)

Server preview React Email untuk template di `packages/email`. Hanya alat dev
lokal: tidak berisi template, tidak mengirim email, dan tidak di-deploy.
Template, subjek, dan fungsi kirim tetap di `packages/email`; `apps/api` yang
mengirimnya.

| Perintah         | Fungsi                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `bun run dev`    | Preview di http://localhost:3000 (hot reload, ikut `bun run dev` root) |
| `bun run export` | Render semua template ke HTML statis di `dist/` (di-gitignore)         |

Data contoh di preview diambil dari `PreviewProps` tiap template; default
export template dibaca CLI. Template baru cukup ditambahkan di
`packages/email/src/templates/` dan langsung muncul di sini. Jangan menaruh file
lain di folder itu, karena CLI menampilkan setiap file di dalamnya sebagai email
(komponen bersama ada di `packages/email/src/components/`).

## Dependensi

`react-email` (CLI `email`) dan `@react-email/ui` (aplikasi preview, membawa
Next.js) di catalog `services`, keduanya **dipin persis ke versi yang sama**:
CLI menolak jalan bila versi `@react-email/ui` berbeda. Upgrade keduanya
bersamaan.
