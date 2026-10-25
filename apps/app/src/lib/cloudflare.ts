import { createContext } from "react-router";
import type { RouterContextProvider } from "react-router";

export interface CloudflareContext {
  env: Env;
  ctx: ExecutionContext;
}

/**
 * Binding & execution context Worker per request. Diisi di `src/worker.ts`;
 * sejak React Router 8 context loader/action adalah `RouterContextProvider`,
 * jadi dibaca lewat `getCloudflare(context)`, bukan `context.cloudflare`.
 */
export const cloudflareContext = createContext<CloudflareContext>();

export const getCloudflare = (context: Readonly<RouterContextProvider>) =>
  context.get(cloudflareContext);
