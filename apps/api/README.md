# @bermula/api

API Hono di Cloudflare Workers: handler better-auth, endpoint aplikasi yang
terdokumentasi OpenAPI 3.1, dan dokumentasi Scalar.

## Menjalankan

```sh
cp .dev.vars.example .dev.vars   # isi nilai wajib (lihat komentar di file)
bun run dev                      # wrangler dev → http://localhost:8787
```

| Path                            | Isi                                                      |
| ------------------------------- | -------------------------------------------------------- |
| `GET /health`                   | Cek status (tanpa DB)                                    |
| `GET, POST /api/auth/*`         | better-auth (sign-up, sign-in, organisasi, 2FA, admin)   |
| `GET /api/me`                   | Pengguna login + organisasi aktif                        |
| `/api/images`, `/api/documents` | Upload, daftar, unduh, hapus file (lihat di bawah)       |
| `GET /docs`, `/openapi.json`    | Scalar & dokumen OpenAPI (hanya `API_DOCS_ENABLED=true`) |

`/openapi.json` juga memuat endpoint better-auth (tag `Auth*`, model `Auth*`),
digabung dari `auth.api.generateOpenAPISchema()` di `src/lib/auth-openapi.ts`.
`/api/auth/open-api/*` ikut dijaga `API_DOCS_ENABLED`; halaman `/api/auth/reference`
bawaan plugin dimatikan.

Perubahan pada `.dev.vars` baru terbaca setelah `wrangler dev` di-restart.

## Upload file

Byte file dikirim browser langsung ke R2 lewat presigned URL, tidak lewat
Worker. Image dan dokumen punya endpoint, kebijakan (`UPLOAD_POLICIES` di
`@bermula/core/files`), dan prefix R2 sendiri, tetapi satu tabel `storage_files`.

1. `POST /api/images` `{ fileName, contentType, size }` → `{ file, upload }`.
2. `PUT upload.url` dengan body file dan header `content-type` dari
   `upload.headers` (URL berlaku 10 menit).
3. `POST /api/images/{id}/complete` → status `uploaded` setelah objek dicek ada.

`GET /api/images?cursor&limit` (paginasi keyset), `GET /api/images/{id}/download`
(URL 5 menit; image `inline`, dokumen `attachment`), `DELETE /api/images/{id}`
(pengunggah atau owner/admin). Semua endpoint dibatasi organisasi aktif.

Bucket R2 harus privat dan punya aturan CORS untuk origin app (`PUT`, `GET`,
header `content-type`).

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
