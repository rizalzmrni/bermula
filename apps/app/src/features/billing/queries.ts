import { PLAN } from "@bermula/core/plans";
import { HttpError } from "@bermula/data/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";

import { getBrowserApiClient } from "../../lib/api-client";
import type { ApiClient } from "../../lib/api-client";
import { billingKeys } from "./query-keys";

/** Ringkasan tagihan dari `GET /api/organizations/{organizationId}/billing/subscription`. */
export type BillingOverview = InferResponseType<
  ApiClient["api"]["organizations"][":organizationId"]["billing"]["subscription"]["$get"],
  200
>;

export const fetchBillingOverview = async (
  client: ApiClient,
  organizationId: string
): Promise<BillingOverview> => {
  const response = await client.api.organizations[
    ":organizationId"
  ].billing.subscription.$get({ param: { organizationId } });
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

/** Satu definisi query untuk loader (Service Binding) dan browser. */
export const billingOverviewQueryOptions = (
  client: ApiClient,
  organizationId: string
) =>
  queryOptions({
    queryFn: () => fetchBillingOverview(client, organizationId),
    queryKey: billingKeys.overview(organizationId),
  });

/** Alasan halaman menunggu perubahan dari webhook Polar. */
export const BILLING_AWAIT = {
  /** Baru kembali dari Checkout: tunggu sampai paket berubah dari `free`. */
  payment: "payment",
  /** Baru kembali dari Portal: isi perubahannya tidak diketahui. */
  portal: "portal",
} as const;

export type BillingAwait = (typeof BILLING_AWAIT)[keyof typeof BILLING_AWAIT];

export const BILLING_POLL_INTERVAL_MS = 3000;

/**
 * Batas pengambilan data setelah kembali dari Portal (±30 detik). Perubahan di
 * Portal (batal, ganti paket, kartu baru) tidak bisa dideteksi dari halaman,
 * jadi polling dibatasi jumlahnya, bukan menunggu kondisi tertentu.
 */
export const PORTAL_MAX_DATA_UPDATES = 10;

/** Interval `refetchInterval`, atau `false` untuk berhenti mengambil ulang. */
export const getBillingRefetchInterval = ({
  awaiting,
  dataUpdateCount,
  plan,
}: {
  awaiting: BillingAwait | null;
  /** `query.state.dataUpdateCount`; termasuk data hasil prefetch loader. */
  dataUpdateCount: number;
  plan: BillingOverview["plan"] | undefined;
}): number | false => {
  if (awaiting === BILLING_AWAIT.payment && plan === PLAN.free) {
    return BILLING_POLL_INTERVAL_MS;
  }
  if (
    awaiting === BILLING_AWAIT.portal &&
    dataUpdateCount < PORTAL_MAX_DATA_UPDATES
  ) {
    return BILLING_POLL_INTERVAL_MS;
  }
  return false;
};

/**
 * `useQuery`, bukan suspense: loader hanya mencoba prefetch, jadi bila api
 * sedang gagal halaman tetap tampil dengan state error + coba lagi.
 *
 * `awaiting`: baru kembali dari Checkout atau Portal. Webhook Polar bisa tiba
 * beberapa detik setelah redirect, jadi data diambil ulang sementara waktu.
 */
export const useBillingOverview = ({
  awaiting,
  organizationId,
}: {
  awaiting: BillingAwait | null;
  organizationId: string;
}) =>
  useQuery({
    ...billingOverviewQueryOptions(getBrowserApiClient(), organizationId),
    refetchInterval: (query) =>
      getBillingRefetchInterval({
        awaiting,
        dataUpdateCount: query.state.dataUpdateCount,
        plan: query.state.data?.plan,
      }),
  });
