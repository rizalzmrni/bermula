// Variabel `VITE_*` milik app ini (skema: packages/env/src/app.ts). Tanpa ini,
// `ImportMetaEnv` Vite tidak cocok dengan `AppClientRuntimeEnv` di `getAppClientEnv`.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
