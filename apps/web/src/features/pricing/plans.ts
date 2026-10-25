import { formatCurrency } from "@bermula/core/format";

export interface Plan {
  id: string;
  name: string;
  description: string;
  /** Harga per bulan dalam Rupiah; `0` untuk paket gratis. */
  monthlyPrice: number;
  features: string[];
  /** Paket yang disorot sebagai pilihan utama. */
  highlighted?: boolean;
}

/**
 * Daftar paket statis (contoh; sesuaikan dengan produk Anda). Akan
 * disambungkan ke harga Stripe di Fase 6 agar tidak didefinisikan dua kali.
 */
export const PLANS: Plan[] = [
  {
    description: "Untuk mencoba dan proyek pribadi.",
    features: ["1 organisasi", "Hingga 3 anggota", "Penyimpanan 1 GB"],
    id: "free",
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
    id: "pro",
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
    id: "business",
    monthlyPrice: 499_000,
    name: "Bisnis",
  },
];

/** Label harga paket: "Gratis" untuk `0`, selain itu Rupiah (`id-ID`). */
export const formatPlanPrice = (monthlyPrice: number) =>
  monthlyPrice === 0 ? "Gratis" : formatCurrency(monthlyPrice);
