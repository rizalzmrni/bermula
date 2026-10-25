import { hcWithType } from "@bermula/api/client";
import { getAppClientEnv } from "@bermula/env/app";

/** Cukup `fetch` dari Service Binding `API`; memudahkan test dengan fetch palsu. */
export type ApiBinding = Pick<Fetcher, "fetch">;

// Service Binding mengabaikan host; hanya path yang sampai ke Worker api.
// Ini bukan domain sungguhan, jadi tidak melanggar aturan "tanpa hardcode domain".
const SERVICE_BINDING_ORIGIN = "https://api.service-binding";

/**
 * Header request asli yang diteruskan ke api:
 * - `cookie`: sesi pengguna.
 * - `origin`: dicek better-auth (CSRF) untuk POST.
 * - `cf-connecting-ip`: rate limit api per pengguna, bukan per Worker app.
 *   Aman diteruskan karena Cloudflare yang mengisinya di edge.
 * - `user-agent`: dicatat better-auth di sesi.
 */
const FORWARDED_HEADERS = [
  "cookie",
  "origin",
  "cf-connecting-ip",
  "user-agent",
] as const;

export const getForwardedHeaders = (request: Request) => {
  const headers: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }
  return headers;
};

type ApiClientOptions =
  | { mode: "server"; request: Request; api: ApiBinding }
  | { mode: "browser" };

/**
 * Satu-satunya pembuat klien api. Server (loader/action): lewat Service
 * Binding dengan cookie dari request asli. Browser: `VITE_API_URL` dengan
 * cookie lintas-origin. `hcWithType` memakai tipe yang sudah di-compile api
 * (`bun run build:types`), bukan meng-infer source api di sini.
 */
export const createApiClient = (options: ApiClientOptions) => {
  if (options.mode === "browser") {
    return hcWithType(getAppClientEnv().VITE_API_URL, {
      init: { credentials: "include" },
    });
  }

  return hcWithType(SERVICE_BINDING_ORIGIN, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      options.api.fetch(input, init),
    headers: getForwardedHeaders(options.request),
  });
};

export type ApiClient = ReturnType<typeof createApiClient>;

interface FetchApiOptions {
  api: ApiBinding;
  request: Request;
  path: `/${string}`;
  init?: RequestInit;
}

/**
 * Fetch mentah lewat Service Binding untuk endpoint di luar `AppType`
 * (handler better-auth `/api/auth/*` tidak didefinisikan dengan `createRoute`).
 */
export const fetchApi = ({ api, request, path, init }: FetchApiOptions) => {
  const headers = new Headers(init?.headers);
  for (const [name, value] of Object.entries(getForwardedHeaders(request))) {
    headers.set(name, value);
  }
  return api.fetch(`${SERVICE_BINDING_ORIGIN}${path}`, { ...init, headers });
};

/** Header `Set-Cookie` dari api, untuk diteruskan ke browser lewat respons app. */
export const getSetCookieHeaders = (response: Response) => {
  const headers = new Headers();
  for (const cookie of response.headers.getSetCookie()) {
    headers.append("Set-Cookie", cookie);
  }
  return headers;
};
