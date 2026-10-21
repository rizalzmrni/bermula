# apps/web — Situs marketing (React Router di Workers)

Aturan root `CLAUDE.md` tetap berlaku.

@../../docs/react-router.md

## Khusus apps/web

- Utamakan SSR dan konten statis; hindari data fetching klien yang tidak perlu.
- Setiap halaman punya metadata (`meta`) lewat `packages/seo`; sitemap dan
  JSON-LD juga dari paket itu.
- Google Analytics dari `packages/analytics`; hormati persetujuan cookie.
- Section marketing di `app/features/<section>/`.
- Baca `DESIGN.md` sebelum tugas UI.
