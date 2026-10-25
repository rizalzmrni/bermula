# @bermula/storybook (apps/storybook)

Katalog komponen `packages/design-system`. Hanya alat dev/dokumentasi; tidak
di-deploy ke Workers.

| Perintah              | Fungsi                                                       |
| --------------------- | ------------------------------------------------------------ |
| `bun run dev`         | Storybook di http://localhost:6006 (ikut `bun run dev` root) |
| `bun run build`       | Situs statis di `dist/` (di-gitignore)                       |
| `bun run check-types` | Type-check story dan konfigurasi                             |

## Struktur

- `.storybook/main.ts` — Storybook 10 + `@storybook/react-vite`; addon docs,
  a11y (panel Accessibility), themes. Telemetri dimatikan.
- `.storybook/preview.tsx` — decorator setara root layout app: `MemoryRouter`
  (Link/NavLink & adapter nuqs butuh router) + `DesignSystemProvider`. Tema dari
  toolbar diteruskan ke next-themes lewat `forcedTheme` (default terang).
- `.storybook/preview.css` — hanya meng-import `globals.css` design-system.
- `vite.config.ts` — plugin Tailwind v4, dibaca otomatis oleh Storybook.
- `src/stories/<kelompok>/<komponen>.stories.tsx` — kelompok `foundations`
  (token warna), `ui` (primitif shadcn inti), `form`, `feedback`, `layout`,
  `navigation`.

## Aturan

- Story ditaruh di app ini, **bukan** di `packages/design-system`, agar paket
  library tidak bergantung pada Storybook.
- Satu file per komponen, `title` berbentuk `Kelompok/NamaKomponen`, teks contoh
  berbahasa Indonesia, data contoh bersama di file `.ts` sebelahnya (mis.
  `layout/navigation-data.ts`).
- Data deterministik: tanggal/tahun ditulis tetap, bukan `new Date()`.
- Komponen baru di design-system: tambahkan story-nya di sini.
- Semua paket `storybook`/`@storybook/*` dipin ke versi yang sama (catalog
  `storybook`); upgrade bersamaan.
