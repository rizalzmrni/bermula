import type { InferResponseType } from "hono/client";
import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";

import { createApiClient } from "./api-client";
import type { ApiBinding, ApiClient } from "./api-client";
import { getCloudflare } from "./cloudflare";
import { getLoginUrl } from "./redirect";

/** Akun dari `GET /api/me`: pengguna + organisasi aktif + role-nya. */
export type Account = InferResponseType<ApiClient["api"]["me"]["$get"], 200>;

interface AccountArgs {
  request: Request;
  api: ApiBinding;
}

/**
 * Akun pengguna saat ini, atau `null` bila belum login. Status lain dari api
 * (403 tanpa organisasi aktif, 429, 5xx) dilempar sebagai respons error ke
 * ErrorBoundary, bukan dianggap "belum login".
 */
export const fetchAccount = async ({
  request,
  api,
}: AccountArgs): Promise<Account | null> => {
  const client = createApiClient({ api, mode: "server", request });
  const response = await client.api.me.$get();

  if (response.status === 200) {
    return await response.json();
  }
  if (response.status === 401) {
    return null;
  }
  throw data(null, { status: response.status });
};

interface SessionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export const getAccount = ({ request, context }: SessionArgs) =>
  fetchAccount({ api: getCloudflare(context).env.API, request });

/** Auth gate halaman terproteksi: tanpa sesi → redirect ke login + `redirectTo`. */
export const requireSession = async (args: SessionArgs) => {
  const account = await getAccount(args);
  if (!account) {
    throw redirect(getLoginUrl(args.request));
  }
  return account;
};
