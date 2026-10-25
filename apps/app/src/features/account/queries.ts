import { HttpError } from "@bermula/data/query-client";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";

import { getBrowserApiClient } from "../../lib/api-client";
import type { ApiClient } from "../../lib/api-client";
import { accountKeys } from "./query-keys";

/** Akun dari `GET /api/me`: pengguna + organisasi aktif + role-nya. */
export type Account = InferResponseType<ApiClient["api"]["me"]["$get"], 200>;

/** Selain 200, status dilempar sebagai `HttpError` (401 = belum login). */
export const fetchAccount = async (client: ApiClient): Promise<Account> => {
  const response = await client.api.me.$get();
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

/**
 * Satu definisi query akun untuk server (klien Service Binding di loader)
 * dan browser (klien `VITE_API_URL` saat refetch).
 */
export const accountQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryFn: () => fetchAccount(client),
    queryKey: accountKeys.current(),
  });

/**
 * Akun pengguna di area terproteksi. Datanya sudah di-prefetch loader layout
 * dan di-hydrate, jadi tidak pernah suspend saat render pertama.
 */
export const useAccount = () =>
  useSuspenseQuery(accountQueryOptions(getBrowserApiClient())).data;
