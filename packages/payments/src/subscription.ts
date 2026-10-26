import { fromStripeLookupKey } from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import type { Stripe } from "stripe";

import type { StripeEvent } from "./webhook";

/**
 * Kunci metadata subscription/customer di Stripe yang menyimpan organisasi
 * pemilik. Diisi saat membuat Checkout; dipakai webhook untuk mencari pemilik.
 */
export const ORGANIZATION_METADATA_KEY = "organizationId";

const MS_PER_SECOND = 1000;

/** Bagian subscription Stripe yang dipakai; `Stripe.Subscription` cocok dengannya. */
export interface SubscriptionSource {
  id: string;
  customer: string | { id: string };
  metadata: Record<string, string>;
  status: string;
  cancel_at_period_end: boolean;
  cancel_at: number | null;
  items: {
    data: {
      current_period_end: number;
      price: { lookup_key: string | null };
    }[];
  };
}

/** Bentuk langganan yang disimpan di Postgres (sumber kebenaran otorisasi). */
export interface SubscriptionSnapshot {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  /** `null` bila metadata kosong (mis. subscription dibuat manual di dashboard). */
  organizationId: string | null;
  /** `null` bila Price-nya tidak punya `lookup_key` paket yang dikenal. */
  plan: PaidPlanId | null;
  status: string;
  currentPeriodEnd: Date | null;
  /** Langganan dijadwalkan berhenti (akhir periode atau tanggal `cancel_at`). */
  cancelAtPeriodEnd: boolean;
}

const idOf = (value: string | { id: string }) =>
  typeof value === "string" ? value : value.id;

const findPlan = (items: SubscriptionSource["items"]["data"]) => {
  for (const item of items) {
    const plan = fromStripeLookupKey(item.price.lookup_key);
    if (plan) {
      return plan;
    }
  }
  return null;
};

/**
 * Sejak API `2025-03-31`, periode tagihan ada di tiap item subscription, bukan
 * di subscription. Satu paket = satu item; ambil yang paling akhir bila ada lebih.
 */
const latestPeriodEnd = (items: SubscriptionSource["items"]["data"]) =>
  items.length > 0
    ? new Date(
        Math.max(...items.map((item) => item.current_period_end)) *
          MS_PER_SECOND
      )
    : null;

export const toSubscriptionSnapshot = (
  subscription: SubscriptionSource
): SubscriptionSnapshot => ({
  cancelAtPeriodEnd:
    subscription.cancel_at_period_end || subscription.cancel_at !== null,
  currentPeriodEnd: latestPeriodEnd(subscription.items.data),
  organizationId: subscription.metadata[ORGANIZATION_METADATA_KEY] ?? null,
  plan: findPlan(subscription.items.data),
  status: subscription.status,
  stripeCustomerId: idOf(subscription.customer),
  stripeSubscriptionId: subscription.id,
});

/**
 * ID subscription yang perlu disinkronkan dari sebuah event, atau `null` bila
 * event tidak relevan untuk langganan. Webhook lalu mengambil ulang subscription
 * terbaru dari Stripe, sehingga urutan event yang tiba tidak berpengaruh.
 */
export const getSubscriptionIdFromEvent = (
  event: StripeEvent
): string | null => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session: Stripe.Checkout.Session = event.data.object;
      return session.mode === "subscription" && session.subscription
        ? idOf(session.subscription)
        : null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      return event.data.object.id;
    }
    default: {
      return null;
    }
  }
};
