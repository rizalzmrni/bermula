import type { QueryClient } from "@tanstack/react-query";
import { createContext } from "react-router";
import type { RouterContextProvider } from "react-router";

/**
 * QueryClient loader/action, dibuat baru per request di `src/worker.ts`:
 * cache-nya berisi data pengguna, jadi tidak boleh dibagi antar-request.
 * Hasilnya dikirim ke browser lewat `dehydrate()` di loader.
 */
export const queryClientContext = createContext<QueryClient>();

export const getQueryClient = (context: Readonly<RouterContextProvider>) =>
  context.get(queryClientContext);
