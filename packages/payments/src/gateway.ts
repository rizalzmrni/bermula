import type { PaidPlanId } from "@bermula/core/plans";
import { createCheckouts } from "@polar-sh/sdk/2026-10/services/checkouts";
import { createCustomerSessions } from "@polar-sh/sdk/2026-10/services/customer_sessions";
import { listProducts } from "@polar-sh/sdk/2026-10/services/products";

import type { PolarClient } from "./client";
import { PLAN_METADATA_KEY } from "./subscription";

/**
 * Operasi Polar yang dipakai api, dalam bentuk sempit. Service bergantung pada
 * interface ini, bukan SDK, sehingga mudah dipalsukan di test dan Polar bisa
 * diganti penyedia lain tanpa menyentuh service.
 *
 * Organisasi dipetakan ke customer Polar lewat `external_id` = ID organisasi,
 * jadi ID customer Polar tidak perlu disimpan sebelum Checkout selesai.
 */
export interface PaymentGateway {
  /** ID produk aktif untuk paket, atau `null` bila belum dibuat di Polar. */
  findProductId: (plan: PaidPlanId) => Promise<string | null>;
  createCheckout: (input: {
    organizationId: string;
    productId: string;
    successUrl: string;
    returnUrl: string;
    /** IP pelanggan asli; Polar memakainya untuk memilih mata uang & pajak. */
    customerIpAddress: string | undefined;
  }) => Promise<{ url: string }>;
  createPortalSession: (input: {
    organizationId: string;
    returnUrl: string;
  }) => Promise<{ url: string }>;
}

export const createPolarGateway = (polar: PolarClient): PaymentGateway => ({
  createCheckout: async (input) => {
    const checkout = await createCheckouts(polar)({
      customer_ip_address: input.customerIpAddress ?? null,
      // Customer dibuat Polar saat Checkout selesai, dengan `external_id` ini.
      external_customer_id: input.organizationId,
      products: [input.productId],
      return_url: input.returnUrl,
      success_url: input.successUrl,
    });
    return { url: checkout.url };
  },
  createPortalSession: async (input) => {
    const session = await createCustomerSessions(polar)({
      external_customer_id: input.organizationId,
      return_url: input.returnUrl,
    });
    return { url: session.customer_portal_url };
  },
  findProductId: async (plan) => {
    const products = await listProducts(polar)({
      is_archived: false,
      is_recurring: true,
      limit: 1,
      metadata: { [PLAN_METADATA_KEY]: plan },
    });
    return products.items[0]?.id ?? null;
  },
});
