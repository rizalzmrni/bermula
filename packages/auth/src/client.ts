import { createAuthClient as createBetterAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

export interface AuthClientOptions {
  /** Origin apps/api, mis. `VITE_API_URL` di browser. */
  baseURL: string;
  /**
   * Saat SSR di apps/app, isi dengan `context.cloudflare.env.API.fetch`
   * (Service Binding) agar request tidak lewat jaringan publik.
   */
  fetch?: typeof globalThis.fetch;
}

/**
 * Klien better-auth untuk apps/app & apps/web. Sengaja tidak mengimpor
 * konfigurasi server; tipe plugin diambil dari plugin klien yang sepadan.
 * Klien vanilla (bukan `better-auth/react`): status sesi di UI dikelola
 * TanStack Query, sesuai pola loader prefetch.
 */
export const createAuthClient = ({ baseURL, fetch }: AuthClientOptions) =>
  createBetterAuthClient({
    baseURL,
    fetchOptions: {
      // Api berbeda origin dengan app, jadi cookie sesi harus ikut dikirim.
      credentials: "include",
      customFetchImpl: fetch,
    },
    plugins: [organizationClient()],
  });

export type AuthClient = ReturnType<typeof createAuthClient>;
