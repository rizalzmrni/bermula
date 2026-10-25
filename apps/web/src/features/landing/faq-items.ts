import type { FaqItem } from "@bermula/seo/json-ld";

/**
 * Satu sumber untuk FAQ yang tampil dan JSON-LD `FAQPage`; Google mensyaratkan
 * keduanya sama persis.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    answer:
      "Ya. Paket Gratis bisa dipakai tanpa batas waktu dan tanpa kartu kredit. Anda dapat meningkatkan paket kapan saja.",
    question: "Apakah ada paket gratis?",
  },
  {
    answer:
      "Data setiap organisasi dipisahkan di database, akses dilindungi sesi dan peran, dan file privat hanya bisa diunduh lewat URL bertanda tangan yang kedaluwarsa.",
    question: "Bagaimana data saya diamankan?",
  },
  {
    answer:
      "Bisa. Satu akun dapat menjadi anggota beberapa organisasi dan berpindah di antaranya tanpa keluar-masuk.",
    question: "Bisakah saya mengelola beberapa tim?",
  },
  {
    answer:
      "Bisa. Paket berbayar dapat dibatalkan kapan saja dan tetap aktif hingga akhir periode tagihan.",
    question: "Bisakah saya berhenti berlangganan kapan saja?",
  },
];
