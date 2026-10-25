import { PLAN } from "@bermula/core/plans";
import { HttpError } from "@bermula/data/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";

import { getBrowserApiClient } from "../../lib/api-client";
import type { ApiClient } from "../../lib/api-client";
import { billingKeys } from "./query-keys";

/** Ringkasan tagihan organisasi aktif dari `GET /api/billing/subscription`. */
export type BillingOverview = InferResponseType<
  ApiClient["api"]["billing"]["subscription"]["$get"],
  200
>;

export const fetchBillingOverview = async (
  client: ApiClient
): Promise<BillingOverview> => {
  const response = await client.api.billing.subscription.$get();
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

/** Satu definisi query untuk loader (Service Binding) dan browser. */
export const billingOverviewQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryFn: () => fetchBillingOverview(client),
    queryKey: billingKeys.overview(),
  });

const PAYMENT_POLL_INTERVAL_MS = 3000;

/**
 * `useQuery`, bukan suspense: loader hanya mencoba prefetch, jadi bila api
 * sedang gagal halaman tetap tampil dengan state error + coba lagi.
 *
 * `awaitingPayment`: baru kembali dari Checkout. Webhook Stripe bisa tiba
 * beberapa detik setelah redirect, jadi data diambil ulang sampai paket berubah.
 */
export const useBillingOverview = ({
  awaitingPayment,
}: {
  awaitingPayment: boolean;
}) =>
  useQuery({
    ...billingOverviewQueryOptions(getBrowserApiClient()),
    refetchInterval: (query) =>
      awaitingPayment && query.state.data?.plan === PLAN.free
        ? PAYMENT_POLL_INTERVAL_MS
        : false,
  });
