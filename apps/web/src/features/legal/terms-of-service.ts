import { APP_NAME } from "@bermula/core/brand";

import type { LegalDocument } from "./legal-page";

// Placeholder: ganti seluruh isi dengan syarat layanan yang sudah ditinjau.
export const TERMS_OF_SERVICE: LegalDocument = {
  lastUpdated: new Date("2026-10-25T00:00:00+07:00"),
  sections: [
    {
      heading: "Penerimaan syarat",
      paragraphs: [
        `Dengan membuat akun atau memakai ${APP_NAME}, Anda menyetujui syarat dan ketentuan ini.`,
      ],
    },
    {
      heading: "Akun",
      paragraphs: [
        "Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan atas seluruh aktivitas yang terjadi di dalamnya.",
      ],
    },
    {
      heading: "Penggunaan yang dilarang",
      paragraphs: [
        "Anda tidak boleh memakai layanan untuk aktivitas yang melanggar hukum, mengganggu sistem, atau melanggar hak pihak lain.",
      ],
    },
    {
      heading: "Langganan dan pembayaran",
      paragraphs: [
        "Paket berbayar ditagih di awal setiap periode dan dapat dibatalkan kapan saja; layanan tetap aktif hingga akhir periode berjalan.",
      ],
    },
    {
      heading: "Perubahan syarat",
      paragraphs: [
        "Kami dapat memperbarui syarat ini. Perubahan penting akan diberitahukan melalui email sebelum berlaku.",
      ],
    },
  ],
  title: "Syarat & Ketentuan",
};
