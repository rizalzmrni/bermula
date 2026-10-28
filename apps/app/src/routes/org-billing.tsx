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
import { useCurrentOrganization } from "../features/organizations/current-organization";
import { requireOrganization } from "../features/organizations/organization.server";
import { getQueryClient } from "../lib/query-client";
import { getServerApiClient, requireSession } from "../lib/session.server";
import type { Route } from "./+types/org-billing";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE = 422;

export const meta = () => [{ title: `Tagihan — ${APP_NAME}` }];

/**
 * `prefetchQuery` tidak melempar: bila api gagal, query tidak ikut di-dehydrate
 * dan komponen menampilkan state error dengan tombol coba lagi.
 */
export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const organization = await requireOrganization({
    context,
    request,
    slug: params.slug,
  });
  const queryClient = getQueryClient(context);
  await queryClient.prefetchQuery(
    billingOverviewQueryOptions(
      getServerApiClient({ context, request }),
      organization.id
    )
  );
  return { dehydratedState: dehydrate(queryClient) };
};

/** Berhasil: redirect ke halaman Polar (Checkout/Portal). Gagal: pesan untuk form. */
export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  await requireSession({ context, request });
  const organization = await requireOrganization({
    context,
    request,
    slug: params.slug,
  });

  const parsed = billingActionSchema.safeParse(
    Object.fromEntries(await request.formData())
  );
  if (!parsed.success) {
    return data<BillingActionResult>(
      { formError: "Paket tidak valid." },
      { status: HTTP_BAD_REQUEST }
    );
  }

  const args = {
    client: getServerApiClient({ context, request }),
    organizationId: organization.id,
  };
  const result =
    parsed.data.intent === BILLING_INTENT.checkout
      ? await startCheckout({ ...args, plan: parsed.data.plan })
      : await openBillingPortal(args);

  if ("url" in result) {
    throw redirect(result.url);
  }
  return data<BillingActionResult>(result, { status: HTTP_UNPROCESSABLE });
};

const OrganizationBillingPage = ({ loaderData }: Route.ComponentProps) => {
  const organization = useCurrentOrganization();
  const [searchParams] = useSearchParams();
  const checkoutResult = readCheckoutResult(searchParams);

  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tagihan</h1>
          <p className="text-muted-foreground text-sm">
            Paket langganan dan pembayaran {organization.name}.
          </p>
        </div>
        <BillingSection
          checkoutResult={checkoutResult}
          organizationId={organization.id}
          portalReturn={readPortalReturn(searchParams)}
        />
      </div>
    </HydrationBoundary>
  );
};

export default OrganizationBillingPage;
