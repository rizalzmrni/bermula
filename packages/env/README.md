# @bermula/env

Skema t3-env per app. Kode aplikasi membaca env **hanya** lewat objek dari paket
ini; `import.meta.env` hanya dibaca di sini.

| Entry              | Skema                                  | File contoh                  |
| ------------------ | -------------------------------------- | ---------------------------- |
| `@bermula/env/api` | `createApiEnv(c.env)` — server         | `apps/api/.dev.vars.example` |
| `@bermula/env/app` | `getAppClientEnv()` — klien (`VITE_*`) | `apps/app/.env.example`      |
| `@bermula/env/web` | `getWebClientEnv()` — klien (`VITE_*`) | `apps/web/.env.example`      |

- **Server (Workers):** env baru ada saat request, jadi skema berbentuk factory.
  Panggil `createApiEnv(c.env)` sekali per request di middleware; di React Router
  pakai `context.cloudflare.env` di loader/action.
- **Klien:** Vite mengganti `import.meta.env` saat build. Panggil getter sekali
  di `app/lib/env.ts`, lalu impor hasilnya dari sana.
- Semua URL berupa **origin** (`http://localhost:5173`), tanpa path atau
  trailing slash, karena CORS/cookie membandingkan origin secara persis.
- Menambah variabel: perbarui file contoh **dan** skema di sini bersamaan; nama
  dan jumlahnya harus sama.
