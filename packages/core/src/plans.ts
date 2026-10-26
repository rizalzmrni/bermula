import { z } from "zod";

import { formatCurrency } from "./format";

/**
 * Katalog paket langganan: satu sumber untuk halaman harga (apps/web), halaman
 * tagihan (apps/app), dan api (checkout & otorisasi fitur). Harga yang ditagih
 * tetap milik Stripe; `monthlyPrice` di sini hanya untuk tampilan dan wajib
 * disamakan dengan Price di Stripe (dicari lewat `lookup_key`).
 */

export const PLAN = {
  business: "business",
  free: "free",
  pro: "pro",
} as const;

export type PlanId = (typeof PLAN)[keyof typeof PLAN];

/** Paket yang dibeli lewat Stripe Checkout; `free` tidak punya Price. */
export const PAID_PLANS = [PLAN.pro, PLAN.business] as const;

export type PaidPlanId = (typeof PAID_PLANS)[number];

export const paidPlanSchema = z.enum(PAID_PLANS);

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  /** Harga per bulan dalam Rupiah; `0` untuk paket gratis. */
  monthlyPrice: number;
  features: string[];
  /** Paket yang disorot sebagai pilihan utama. */
  highlighted?: boolean;
}

/** Contoh isi; sesuaikan dengan produk Anda (dan Price di Stripe). */
export const PLANS: readonly PlanDefinition[] = [
  {
    description: "Untuk mencoba dan proyek pribadi.",
    features: ["1 organisasi", "Hingga 3 anggota", "Penyimpanan 1 GB"],
    id: PLAN.free,
    monthlyPrice: 0,
    name: "Gratis",
  },
  {
    description: "Untuk tim kecil yang sedang bertumbuh.",
    features: [
      "Organisasi tanpa batas",
      "Hingga 20 anggota",
      "Penyimpanan 50 GB",
      "Dukungan email",
    ],
    highlighted: true,
    id: PLAN.pro,
    monthlyPrice: 149_000,
    name: "Pro",
  },
  {
    description: "Untuk perusahaan dengan kebutuhan lanjutan.",
    features: [
      "Anggota tanpa batas",
      "Penyimpanan 500 GB",
      "Log audit",
      "Dukungan prioritas",
    ],
    id: PLAN.business,
    monthlyPrice: 499_000,
    name: "Bisnis",
  },
];

export const getPlan = (id: PlanId): PlanDefinition => {
  const plan = PLANS.find((candidate) => candidate.id === id);
  if (!plan) {
    throw new Error(`Unknown plan: ${id}`);
  }
  return plan;
};

/** Label harga paket: "Gratis" untuk `0`, selain itu Rupiah (`id-ID`). */
export const formatPlanPrice = (monthlyPrice: number) =>
  monthlyPrice === 0 ? "Gratis" : formatCurrency(monthlyPrice);

const LOOKUP_KEY_SUFFIX = "_monthly";

/**
 * `lookup_key` Price di Stripe untuk satu paket, mis. `pro_monthly`. Dengan
 * lookup key, ID Price tidak perlu disimpan di env per lingkungan.
 */
export const toStripeLookupKey = (plan: PaidPlanId) =>
  `${plan}${LOOKUP_KEY_SUFFIX}`;

/** Kebalikan `toStripeLookupKey`; `null` untuk Price yang tidak dikenal. */
export const fromStripeLookupKey = (
  lookupKey: string | null | undefined
): PaidPlanId | null =>
  PAID_PLANS.find((plan) => toStripeLookupKey(plan) === lookupKey) ?? null;

/** Status langganan Stripe yang dipakai di aplikasi. */
export const SUBSCRIPTION_STATUS = {
  active: "active",
  canceled: "canceled",
  incomplete: "incomplete",
  incompleteExpired: "incomplete_expired",
  pastDue: "past_due",
  paused: "paused",
  trialing: "trialing",
  unpaid: "unpaid",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/**
 * Status yang tetap mendapat fitur paket. `past_due` ikut: Stripe masih
 * mencoba menagih ulang, dan memutus akses saat itu terlalu agresif. Bila
 * semua percobaan gagal, Stripe mengubah status ke `unpaid`/`canceled`.
 */
const ENTITLED_STATUSES: ReadonlySet<string> = new Set([
  SUBSCRIPTION_STATUS.active,
  SUBSCRIPTION_STATUS.trialing,
  SUBSCRIPTION_STATUS.pastDue,
]);

export const isEntitledStatus = (status: string) =>
  ENTITLED_STATUSES.has(status);

/**
 * Paket yang berlaku untuk otorisasi fitur: paket langganan bila statusnya
 * masih berhak, selain itu `free`.
 */
export const resolveEffectivePlan = (
  subscription: { plan: PlanId; status: string } | null
): PlanId =>
  subscription && isEntitledStatus(subscription.status)
    ? subscription.plan
    : PLAN.free;
