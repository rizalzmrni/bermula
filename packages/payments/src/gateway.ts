import type { StripeClient } from "./client";
import { ORGANIZATION_METADATA_KEY } from "./subscription";
import type { SubscriptionSource } from "./subscription";

/**
 * Operasi Stripe yang dipakai api, dalam bentuk sempit. Service bergantung pada
 * interface ini, bukan klien Stripe, sehingga mudah dipalsukan di test dan
 * Stripe bisa diganti penyedia lain tanpa menyentuh service.
 */
export interface PaymentGateway {
  createCustomer: (input: {
    organizationId: string;
    name: string;
    /** Mencegah customer ganda bila request diulang (Stripe menyimpannya 24 jam). */
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
  /** ID Price aktif untuk `lookup_key`, atau `null` bila belum dibuat di Stripe. */
  findPriceId: (lookupKey: string) => Promise<string | null>;
  createCheckoutSession: (input: {
    customerId: string;
    organizationId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<{ url: string | null }>;
  createPortalSession: (input: {
    customerId: string;
    returnUrl: string;
  }) => Promise<{ url: string }>;
  retrieveSubscription: (id: string) => Promise<SubscriptionSource>;
}

export const createStripeGateway = (stripe: StripeClient): PaymentGateway => ({
  createCheckoutSession: async (input) => {
    const metadata = { [ORGANIZATION_METADATA_KEY]: input.organizationId };
    const session = await stripe.checkout.sessions.create({
      cancel_url: input.cancelUrl,
      client_reference_id: input.organizationId,
      customer: input.customerId,
      line_items: [{ price: input.priceId, quantity: 1 }],
      mode: "subscription",
      // Webhook membaca organisasi dari metadata subscription.
      subscription_data: { metadata },
      success_url: input.successUrl,
    });
    return { url: session.url };
  },
  createCustomer: async (input) => {
    const customer = await stripe.customers.create(
      {
        metadata: { [ORGANIZATION_METADATA_KEY]: input.organizationId },
        name: input.name,
      },
      { idempotencyKey: input.idempotencyKey }
    );
    return { id: customer.id };
  },
  createPortalSession: async (input) => {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  },
  findPriceId: async (lookupKey) => {
    const prices = await stripe.prices.list({
      active: true,
      limit: 1,
      lookup_keys: [lookupKey],
    });
    return prices.data[0]?.id ?? null;
  },
  retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
});
