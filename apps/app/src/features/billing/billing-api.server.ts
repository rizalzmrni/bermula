import type { PaidPlanId } from "@bermula/core/plans";
import { z } from "zod";

import type { ApiClient } from "../../lib/api-client";

/** Hasil panggilan: URL Polar untuk redirect, atau pesan error untuk form. */
export type BillingRedirectResult = { url: string } | { formError: string };

const FALLBACK_MESSAGE = "Gagal membuka halaman pembayaran. Silakan coba lagi.";

// Pesan error api (`{ error: { message } }`) memang ditulis untuk pengguna.
const errorBodySchema = z.object({
  error: z.object({ message: z.string().min(1) }),
});

/** Pesan dari body error api; pesan umum bila body tidak sesuai bentuknya. */
export const readBillingErrorMessage = async (response: {
  json: () => Promise<unknown>;
}) => {
  const parsed = errorBodySchema.safeParse(
    await response.json().catch(() => null)
  );
  return parsed.success ? parsed.data.error.message : FALLBACK_MESSAGE;
};

export const startCheckout = async ({
  client,
  organizationId,
  plan,
}: {
  client: ApiClient;
  organizationId: string;
  plan: PaidPlanId;
}): Promise<BillingRedirectResult> => {
  const response = await client.api.organizations[":organizationId"].billing[
    "checkout-sessions"
  ].$post({
    json: { plan },
    param: { organizationId },
  });
  if (response.status === 201) {
    const { url } = await response.json();
    return { url };
  }
  return { formError: await readBillingErrorMessage(response) };
};

export const openBillingPortal = async ({
  client,
  organizationId,
}: {
  client: ApiClient;
  organizationId: string;
}): Promise<BillingRedirectResult> => {
  const response = await client.api.organizations[":organizationId"].billing[
    "portal-sessions"
  ].$post({ param: { organizationId } });
  if (response.status === 201) {
    const { url } = await response.json();
    return { url };
  }
  return { formError: await readBillingErrorMessage(response) };
};
