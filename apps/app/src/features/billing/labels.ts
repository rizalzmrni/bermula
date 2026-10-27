import { formatDate } from "@bermula/core/format";
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

/** Label status Polar; status baru dari Polar tampil apa adanya. */
export const getSubscriptionStatusLabel = (status: string): StatusLabel =>
  isKnownStatus(status)
    ? STATUS_LABELS[status]
    : { label: status, variant: "outline" };

/** Status yang tetap berjalan sampai akhir periode walau sudah dibatalkan. */
const RUNNING_STATUSES = new Set<string>([
  SUBSCRIPTION_STATUS.active,
  SUBSCRIPTION_STATUS.trialing,
]);

/**
 * Badge langganan. Langganan yang dibatalkan tetap `active` di Polar sampai
 * akhir periode, jadi tanpa penanda ini badge tetap "Aktif" setelah dibatalkan.
 * Masalah pembayaran (mis. `past_due`) tetap diutamakan.
 */
export const getSubscriptionBadge = (subscription: {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}): StatusLabel => {
  const { status, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
  if (!(cancelAtPeriodEnd && RUNNING_STATUSES.has(status))) {
    return getSubscriptionStatusLabel(status);
  }
  const label = currentPeriodEnd
    ? `Berakhir ${formatDate(new Date(currentPeriodEnd), { day: "numeric", month: "short" })}`
    : "Akan berakhir";
  return { label, variant: "secondary" };
};
