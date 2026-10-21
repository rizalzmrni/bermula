# @bermula/observability

Logging dan error tracking tanpa SDK: semuanya lewat `fetch`, sehingga berjalan
sama di Workers dan browser.

| Entry                                 | Isi                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `@bermula/observability/logger`       | `createLogger` — log JSON ke console (Workers Logs) + buffer untuk transport   |
| `@bermula/observability/better-stack` | `createBetterStackTransport` — kirim log ke BetterStack HTTP API               |
| `@bermula/observability/posthog`      | `createPostHogExceptionCapture` — event `$exception` ke PostHog Error Tracking |

## Pola di Workers (per request)

```ts
const logger = createLogger({
  minLevel: env.LOG_LEVEL,
  service: "api",
  transports:
    env.BETTER_STACK_SOURCE_TOKEN && env.BETTER_STACK_INGESTING_URL
      ? [
          createBetterStackTransport({
            ingestingUrl: env.BETTER_STACK_INGESTING_URL,
            sourceToken: env.BETTER_STACK_SOURCE_TOKEN,
          }),
        ]
      : [],
});

logger.info("User created", { userId });
c.executionCtx.waitUntil(logger.flush());
```

- Logger dibuat **per request**; buffer tidak disimpan di variabel modul.
- `flush()` tidak pernah melempar error: kegagalan transport hanya ditulis ke
  console agar request pengguna tidak ikut gagal.
- `captureException(error, { distinctId, handled })` melempar bila PostHog
  menolak; panggil di dalam `waitUntil` dan tangani hasilnya di sana.
- Hanya `logger.ts` yang boleh memakai `console` (aturan `no-console` di
  `oxlint.config.mts`).
- Browser: error klien dikirim lewat `posthog-js` (`captureException`) yang
  disiapkan di `packages/analytics`.
- tsconfig memakai lib `WebWorker` (tanpa DOM) agar hanya API yang ada di
  Workers **dan** browser yang lolos type-check.
