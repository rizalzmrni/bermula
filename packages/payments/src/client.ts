import { Stripe } from "stripe";

export type StripeClient = Stripe;

/**
 * Klien Stripe per request (secret dari binding Worker). HTTP client berbasis
 * `fetch` agar berjalan di Workers. Versi API mengikuti versi yang dipin SDK
 * (`Stripe.API_VERSION`); naikkan bersama upgrade paket `stripe`.
 */
export const createStripeClient = (secretKey: string): StripeClient =>
  new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
