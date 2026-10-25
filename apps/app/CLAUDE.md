# apps/app — Aplikasi utama (React Router di Workers)

Aturan root `CLAUDE.md` tetap berlaku.

@../../docs/react-router.md

## Khusus apps/app

- Fitur produk: satu folder per fitur di `app/features/<fitur>/` berisi
  komponen, `queries.ts`, `query-keys.ts`, dan form fitur tersebut.
- Komponen shadcn di-generate ke `packages/design-system`, bukan ke app ini;
  `app/components/` hanya untuk komponen generik khusus app.
- Semua halaman di bawah area terproteksi memakai `requireSession` di loader.
- Baca `DESIGN.md` sebelum tugas UI.
