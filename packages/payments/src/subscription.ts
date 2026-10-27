import { toPaidPlan } from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import type { models } from "@polar-sh/sdk/2026-10";

import type { PolarWebhookEvent } from "./webhook";

/**
 * Kunci metadata produk Polar yang menyimpan ID paket (`pro`, `business`).
 * Dengan metadata, ID produk tidak perlu disimpan di env per lingkungan.
 */
export const PLAN_METADATA_KEY = "plan";

/** Bagian subscription Polar yang dipakai; `models.Subscription` cocok dengannya. */
export interface SubscriptionSource {
  id: string;
  status: string;
  created_at: string;
  modified_at: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  ends_at: string | null;
  customer: { id: string; external_id?: string | null };
  product: { metadata: models.Subscription["product"]["metadata"] };
}

/** Bentuk langganan yang disimpan di Postgres (sumber kebenaran otorisasi). */
export interface SubscriptionSnapshot {
  polarSubscriptionId: string;
  polarCustomerId: string;
  /** `external_id` customer; diisi api saat Checkout, `null` bila dibuat di dashboard. */
  organizationId: string | null;
  /** `null` bila produknya tidak punya metadata `plan` yang dikenal. */
  plan: PaidPlanId | null;
  status: string;
  currentPeriodEnd: Date;
  /** Langganan dijadwalkan berhenti (akhir periode atau tanggal `ends_at`). */
  cancelAtPeriodEnd: boolean;
  /** Versi data di Polar; snapshot yang lebih lama dari yang tersimpan diabaikan. */
  modifiedAt: Date;
}

export const toSubscriptionSnapshot = (
  subscription: SubscriptionSource
): SubscriptionSnapshot => ({
  cancelAtPeriodEnd:
    subscription.cancel_at_period_end || subscription.ends_at !== null,
  currentPeriodEnd: new Date(subscription.current_period_end),
  modifiedAt: new Date(subscription.modified_at ?? subscription.created_at),
  organizationId: subscription.customer.external_id ?? null,
  plan: toPaidPlan(subscription.product.metadata[PLAN_METADATA_KEY]),
  polarCustomerId: subscription.customer.id,
  polarSubscriptionId: subscription.id,
  status: subscription.status,
});

/**
 * Subscription dari event `subscription.*`, atau `null` bila event tidak
 * relevan untuk langganan. Payload Polar memuat subscription lengkap, jadi
 * tidak perlu mengambil ulang ke API (webhook harus dibalas dalam 2 detik).
 */
export const getSubscriptionFromEvent = (
  event: PolarWebhookEvent
): SubscriptionSource | null => {
  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.canceled":
    case "subscription.uncanceled":
    case "subscription.cycled":
    case "subscription.revoked":
    case "subscription.past_due":
    case "subscription.paused":
    case "subscription.resumed":
    case "subscription.migrated": {
      return event.data;
    }
    default: {
      return null;
    }
  }
};
