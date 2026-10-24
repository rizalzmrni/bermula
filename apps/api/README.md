# @bermula/api

API Hono di Cloudflare Workers: handler better-auth, endpoint aplikasi yang
terdokumentasi OpenAPI 3.1, dan dokumentasi Scalar.

## Menjalankan

```sh
cp .dev.vars.example .dev.vars   # isi nilai wajib (lihat komentar di file)
bun run dev                      # wrangler dev → http://localhost:8787
```

| Path                         | Isi                                                      |
| ---------------------------- | -------------------------------------------------------- |
| `GET /health`                | Cek status (tanpa DB)                                    |
| `GET, POST /api/auth/*`      | better-auth (sign-up, sign-in, organisasi, 2FA, admin)   |
| `GET /api/me`                | Pengguna login + organisasi aktif                        |
| `GET /docs`, `/openapi.json` | Scalar & dokumen OpenAPI (hanya `API_DOCS_ENABLED=true`) |

Perubahan pada `.dev.vars` baru terbaca setelah `wrangler dev` di-restart.

## Struktur

```
src/
├── index.ts          # Rangkaian middleware + route, ekspor AppType
├── openapi.ts        # Security scheme sesi, /openapi.json, /docs
├── types.ts          # Bindings & variabel context
├── lib/              # errors (bentuk error seragam), router (OpenAPIHono)
├── middleware/       # context per request, cors, rate-limit, require-auth
├── routes/           # HTTP + validasi + dokumentasi
└── services/         # logika bisnis & otorisasi
```

Urutan middleware: `context` (env, logger, db, auth) → `cors` → rate limit
(`/api/auth/*` 10/menit, `/api/*` 100/menit per IP) → route.

## Perintah

| Perintah              | Fungsi                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `bun run typegen`     | `wrangler types` → `worker-configuration.d.ts` (tidak di-commit) |
| `bun run check-types` | Type-check                                                       |
| `bun run test`        | Vitest di workerd (`@cloudflare/vitest-plugin`)                  |
| `bun run deploy`      | `wrangler deploy`                                                |

## Produksi

- Secret lewat `wrangler secret put <NAMA>` (lihat `.dev.vars.example`).
- `nodejs_compat` wajib: better-auth memakai `AsyncLocalStorage`.
- Admin pertama dipromosikan manual: `update auth_users set role = 'admin' where email = '...'`.
