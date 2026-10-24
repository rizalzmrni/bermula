# apps/api — Hono di Cloudflare Workers

Aturan tambahan saat bekerja di `apps/api`. Aturan root `CLAUDE.md` tetap berlaku.

## Kontrak API (type-safety end-to-end)

- Pakai `OpenAPIHono` dari `@hono/zod-openapi`. Setiap endpoint didefinisikan
  dengan `createRoute` (method, path, request, responses, tags, summary) dan
  dipasang dengan `.openapi()`, sehingga satu skema Zod menjadi validasi, tipe,
  dan dokumentasi sekaligus.
- Rangkai route secara chaining agar tipe RPC terbentuk; ekspor
  `export type AppType = typeof app` dan `type Bindings` dari `src/index.ts`.
- Skema domain bersama berasal dari `packages/core/src/schemas`.
- Bentuk error seragam, dengan status HTTP yang sesuai:
  `{ error: { code: string; message: string; details?: unknown } }`.
  Ditangani oleh satu `app.onError` global dan `defaultHook` OpenAPIHono untuk
  error validasi.

## Lapisan

`src/routes/<domain>.ts` (HTTP, validasi, dokumentasi) → `src/services/<domain>.ts`
(logika bisnis, otorisasi kepemilikan) → `packages/db`. Route tidak memanggil DB
atau binding R2 langsung.

## Dokumentasi API

- OpenAPI 3.1 dihasilkan dari `createRoute`, tidak ditulis manual.
- `GET /openapi.json` (dokumen) dan `GET /docs` (Scalar).
- Setiap route wajib punya: `tags`, `summary`, `description` bila perilaku tak
  jelas dari nama, skema request, dan skema **semua** respons (sukses & error).
- Skema yang tampil di dokumentasi diberi `.openapi({ example, description })`
  dan nama komponen yang stabil.
- Route yang butuh login ditandai security scheme sesi (cookie better-auth).
- `/docs` dan `/openapi.json` aktif di development; di production hanya bila
  `API_DOCS_ENABLED=true`.

## Env & binding

- Akses lewat `c.env`, bertipe `Bindings`, divalidasi t3-env dengan `runtimeEnv`
  dari binding.
- Tipe binding dihasilkan dengan `wrangler types` (dijalankan oleh `typegen`).
  Pakai `@cloudflare/workers-types` hanya bila dokumentasi resmi Cloudflare
  versi terpasang masih menyarankannya.
- Jangan memasang `@types/bun` atau `@types/node` di tsconfig paket ini: global
  Bun/Node akan lolos type-check padahal tidak ada di workerd.

## Auth & CORS

- Handler better-auth di `/api/auth/*`.
- CORS: `credentials: true`, origin dari `CORS_ORIGINS` (bukan `*`).
- Middleware auth menaruh sesi di context; service menerima `userId` (dan
  `organizationId` bila scoping per-organisasi) sebagai parameter eksplisit.

## Rate limiting

- Pakai binding **Rate Limiting** Workers (dideklarasikan di `wrangler.jsonc`),
  dibungkus di `src/middleware/rate-limit.ts`. Jangan menyimpan hitungan di
  variabel modul: setiap isolate punya memori sendiri, jadi hasilnya tidak berlaku.
- Cek sintaks konfigurasi di dokumentasi resmi Cloudflare sebelum menulisnya.

## Logging, error tracking, analitik

- Logger dari `@bermula/observability/logger`, dibuat **per request** di
  middleware (transport BetterStack bila env-nya diisi). Aktifkan Workers Logs
  di `wrangler.jsonc`; `logger.flush()` dibungkus `c.executionCtx.waitUntil()`
  agar tidak menahan respons.
- Error tracking: PostHog Error Tracking lewat
  `@bermula/observability/posthog` (`$exception` via HTTP capture API) dari
  `app.onError`, dengan `handled: false` dan `distinctId` dari sesi bila ada;
  juga dibungkus `waitUntil`.
- Event PostHog dari server dikirim lewat HTTP capture API dengan `fetch` +
  `waitUntil` (tanpa SDK Node).

## Email & pembayaran

- Panggil fungsi kirim dari `packages/email`; jangan membangun HTML email di sini.
- Route webhook Stripe hanya meneruskan body mentah + header ke
  `packages/payments` (lihat `packages/payments/CLAUDE.md`).

## Testing

- Handler dan middleware diuji dengan `@cloudflare/vitest-plugin` (pengganti
  `@cloudflare/vitest-pool-workers` yang deprecated; mendukung Vitest 5) di
  workerd asli dengan binding lokal. Dipasang sebagai plugin Vite
  `cloudflareTest({ wrangler, miniflare })` di `vitest.config.ts`; test memakai
  `import { env, exports } from "cloudflare:workers"` dan
  `exports.default.fetch(...)`.
- Binding uji (env palsu) ada di `vitest.config.ts`, bukan `.dev.vars`, agar test
  tidak pernah menyambung ke DB atau layanan nyata. Stub layanan eksternal
  (Stripe, Resend, PostHog); jangan memanggil jaringan nyata.
- Request pertama di workerd lambat (±5 detik, Vite mentransformasi modul),
  jadi file test melakukan request pemanasan di `beforeAll`. Rate limit diuji
  dengan `cf-connecting-ip` berbeda per test agar hitungan tidak saling bocor.
