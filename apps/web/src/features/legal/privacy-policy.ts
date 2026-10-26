import { APP_NAME } from "@bermula/core/brand";

import type { LegalDocument } from "./legal-page";

// Placeholder: ganti seluruh isi dengan kebijakan privasi yang sudah ditinjau.
export const PRIVACY_POLICY: LegalDocument = {
  lastUpdated: new Date("2026-10-25T00:00:00+07:00"),
  sections: [
    {
      heading: "Data yang kami kumpulkan",
      paragraphs: [
        "Kami mengumpulkan data yang Anda berikan saat mendaftar, seperti nama dan alamat email, serta file yang Anda unggah ke layanan.",
        "Kami juga mencatat data teknis seperti alamat IP dan jenis peramban untuk keamanan dan pemecahan masalah.",
      ],
    },
    {
      heading: "Cara kami menggunakan data",
      paragraphs: [
        `Data dipakai untuk menyediakan dan meningkatkan ${APP_NAME}, mengirim email terkait akun, serta mencegah penyalahgunaan.`,
      ],
    },
    {
      heading: "Cookie analitik",
      paragraphs: [
        "Dengan persetujuan Anda, kami memakai Google Analytics dan PostHog untuk memahami cara layanan dipakai. Tanpa persetujuan, keduanya tidak dimuat sama sekali.",
        "Anda dapat mengubah atau mencabut persetujuan kapan saja di halaman Pengaturan Cookie. Cookie yang wajib untuk login dan keamanan selalu aktif.",
      ],
    },
    {
      heading: "Berbagi data",
      paragraphs: [
        "Kami tidak menjual data Anda. Data hanya dibagikan kepada penyedia infrastruktur yang membantu kami menjalankan layanan, dengan perjanjian kerahasiaan.",
      ],
    },
    {
      heading: "Hak Anda",
      paragraphs: [
        "Anda dapat mengakses, memperbarui, atau menghapus akun beserta data Anda kapan saja dari pengaturan akun.",
      ],
    },
    {
      heading: "Hubungi kami",
      paragraphs: [
        "Pertanyaan tentang kebijakan ini dapat dikirim ke alamat email dukungan kami.",
      ],
    },
  ],
  title: "Kebijakan Privasi",
};
