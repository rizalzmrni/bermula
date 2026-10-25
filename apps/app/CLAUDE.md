# apps/app — Aplikasi utama (React Router di Workers)

Aturan root `CLAUDE.md` tetap berlaku.

@../../docs/react-router.md

## Khusus apps/app

- Kode sumber di `src/` (`appDirectory: "src"` di `react-router.config.ts`),
  seragam dengan paket lain; entry Worker di `src/worker.ts`.
- Fitur produk: satu folder per fitur di `src/features/<fitur>/` berisi
  komponen, `queries.ts`, `query-keys.ts`, dan form fitur tersebut.
- Komponen shadcn di-generate ke `packages/design-system`, bukan ke app ini;
  `src/components/` hanya untuk komponen generik khusus app.
- Semua halaman di bawah area terproteksi memakai `requireSession` di loader.
- Baca `DESIGN.md` sebelum tugas UI.
