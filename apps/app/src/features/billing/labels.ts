import { SUBSCRIPTION_STATUS } from "@bermula/core/plans";
import type { SubscriptionStatus } from "@bermula/core/plans";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusLabel {
  label: string;
  variant: BadgeVariant;
}

// Sukses = primary, masalah pembayaran = destructive (DESIGN.md); sisanya netral.
const STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.active]: { label: "Aktif", variant: "default" },
  [SUBSCRIPTION_STATUS.canceled]: { label: "Berakhir", variant: "outline" },
  [SUBSCRIPTION_STATUS.incomplete]: {
    label: "Menunggu pembayaran",
    variant: "outline",
  },
  [SUBSCRIPTION_STATUS.incompleteExpired]: {
    label: "Kedaluwarsa",
    variant: "outline",
  },
  [SUBSCRIPTION_STATUS.pastDue]: {
    label: "Pembayaran tertunda",
    variant: "destructive",
  },
  [SUBSCRIPTION_STATUS.paused]: { label: "Dijeda", variant: "outline" },
  [SUBSCRIPTION_STATUS.trialing]: {
    label: "Masa uji coba",
    variant: "secondary",
  },
  [SUBSCRIPTION_STATUS.unpaid]: {
    label: "Belum dibayar",
    variant: "destructive",
  },
} as const satisfies Record<SubscriptionStatus, StatusLabel>;

const isKnownStatus = (status: string): status is SubscriptionStatus =>
  Object.hasOwn(STATUS_LABELS, status);

/** Label status Stripe; status baru dari Stripe tampil apa adanya. */
export const getSubscriptionStatusLabel = (status: string): StatusLabel =>
  isKnownStatus(status)
    ? STATUS_LABELS[status]
    : { label: status, variant: "outline" };
