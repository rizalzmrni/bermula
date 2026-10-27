import { APP_NAME } from "@bermula/core/brand";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { data, redirect, useSearchParams } from "react-router";

import {
  openBillingPortal,
  startCheckout,
} from "../features/billing/billing-api.server";
import { BillingSection } from "../features/billing/billing-section";
import type { BillingActionResult } from "../features/billing/billing-section";
import { billingOverviewQueryOptions } from "../features/billing/queries";
import {
  BILLING_INTENT,
  billingActionSchema,
  readCheckoutResult,
  readPortalReturn,
} from "../features/billing/schemas";
import { createApiClient } from "../lib/api-client";
import { getCloudflare } from "../lib/cloudflare";
import { getQueryClient } from "../lib/query-client";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/settings-billing";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE = 422;

export const meta = () => [{ title: `Tagihan — ${APP_NAME}` }];

const createServerClient = ({
  request,
  context,
}: Pick<Route.LoaderArgs, "request" | "context">) =>
  createApiClient({
    api: getCloudflare(context).env.API,
    mode: "server",
    request,
  });

/**
 * `prefetchQuery` tidak melempar: bila api gagal, query tidak ikut di-dehydrate
 * dan komponen menampilkan state error dengan tombol coba lagi.
 */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const queryClient = getQueryClient(context);
  await queryClient.prefetchQuery(
    billingOverviewQueryOptions(createServerClient({ context, request }))
  );
  return { dehydratedState: dehydrate(queryClient) };
};

/** Berhasil: redirect ke halaman Polar (Checkout/Portal). Gagal: pesan untuk form. */
export const action = async ({ request, context }: Route.ActionArgs) => {
  await requireSession({ context, request });

  const parsed = billingActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return data<BillingActionResult>(
      { formError: "Paket tidak valid." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const client = createServerClient({ context, request });
  const result =
    parsed.data.intent === BILLING_INTENT.checkout
      ? await startCheckout({ client, plan: parsed.data.plan })
      : await openBillingPortal({ client });

  if ("url" in result) {
    throw redirect(result.url);
  }
  return data<BillingActionResult>(result, { status: HTTP_UNPROCESSABLE });
};

const BillingSettingsPage = ({ loaderData }: Route.ComponentProps) => {
  const [searchParams] = useSearchParams();
  const checkoutResult = readCheckoutResult(searchParams);

  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tagihan</h1>
          <p className="text-muted-foreground text-sm">
            Paket langganan dan pembayaran organisasi Anda.
          </p>
        </div>
        <BillingSection
          checkoutResult={checkoutResult}
          portalReturn={readPortalReturn(searchParams)}
        />
      </div>
    </HydrationBoundary>
  );
};

export default BillingSettingsPage;
