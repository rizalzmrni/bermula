// Variabel `VITE_*` milik app ini (skema: packages/env/src/web.ts). Tanpa ini,
// `ImportMetaEnv` Vite tidak cocok dengan `WebClientRuntimeEnv` di `getWebClientEnv`.
interface ImportMetaEnv {
  readonly VITE_ALLOW_INDEXING?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_WEB_URL?: string;
}
