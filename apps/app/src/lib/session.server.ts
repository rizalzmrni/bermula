import { HttpError } from "@bermula/data/query-client";
import type { QueryClient } from "@tanstack/react-query";
import { data, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";

import { accountQueryOptions } from "../features/account/queries";
import type { Account } from "../features/account/queries";
import { accountKeys } from "../features/account/query-keys";
import { createApiClient } from "./api-client";
import type { ApiClient } from "./api-client";
import { getCloudflare } from "./cloudflare";
import { getQueryClient } from "./query-client";
import { getLoginUrl } from "./redirect";

const HTTP_UNAUTHORIZED = 401;

interface SessionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

/**
 * Akun pengguna lewat QueryClient request ini (hasilnya ikut `dehydrate()`
 * di loader), atau `null` bila belum login. Status lain dari api (403 tanpa
 * organisasi aktif, 429, 5xx) dilempar sebagai respons error ke
 * ErrorBoundary, bukan dianggap "belum login".
 */
export const loadAccount = async ({
  queryClient,
  client,
}: {
  queryClient: QueryClient;
  client: ApiClient;
}): Promise<Account | null> => {
  try {
    return await queryClient.ensureQueryData(accountQueryOptions(client));
  } catch (error) {
    if (!(error instanceof HttpError)) {
      throw error;
    }
    if (error.status === HTTP_UNAUTHORIZED) {
      return null;
    }
    throw data(null, { status: error.status });
  }
};

/** Akun pengguna saat ini dari loader/action (klien Service Binding). */
export const getAccount = ({ request, context }: SessionArgs) =>
  loadAccount({
    client: createApiClient({
      api: getCloudflare(context).env.API,
      mode: "server",
      request,
    }),
    queryClient: getQueryClient(context),
  });

/** Auth gate halaman terproteksi: tanpa sesi → redirect ke login + `redirectTo`. */
export const requireSession = async (args: SessionArgs) => {
  const account = await getAccount(args);
  if (!account) {
    throw redirect(getLoginUrl(args.request));
  }
  return account;
};

/**
 * Buang akun yang sudah di-cache request ini setelah action mengubahnya
 * (mis. 2FA). Tanpa JavaScript, action dan loader berjalan dalam request
 * yang sama; tanpa ini loader layout akan memakai data sebelum perubahan.
 */
export const forgetAccount = (context: Readonly<RouterContextProvider>) =>
  getQueryClient(context).removeQueries({ queryKey: accountKeys.all });
