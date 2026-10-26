import type { NavGroup, NavItem } from "@bermula/design-system/lib/navigation";
import {
  IconFiles,
  IconLayoutDashboard,
  IconPhoto,
  IconSettings,
} from "@tabler/icons-react";

/** Data menu contoh bersama untuk story header, footer, nav, dan sidebar. */
export const SITE_ITEMS: NavItem[] = [
  { href: "/", title: "Beranda" },
  {
    href: "/produk",
    items: [
      {
        description: "Masuk, 2FA, dan organisasi.",
        href: "/produk/auth",
        title: "Autentikasi",
      },
      {
        description: "Unggah file ke Cloudflare R2.",
        href: "/produk/storage",
        title: "Penyimpanan",
      },
    ],
    title: "Produk",
  },
  { href: "/harga", title: "Harga" },
  { external: true, href: "https://github.com", title: "GitHub" },
];

export const FOOTER_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", title: "Beranda" },
      { href: "/harga", title: "Harga" },
    ],
    title: "Produk",
  },
  {
    items: [
      { href: "/privasi", title: "Kebijakan Privasi" },
      { href: "/syarat", title: "Syarat & Ketentuan" },
    ],
    title: "Legal",
  },
];

// Item sidebar level atas wajib punya ikon (DESIGN.md: tetap terbaca saat dilipat).
export const APP_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", icon: IconLayoutDashboard, title: "Dasbor" },
      { href: "/documents", icon: IconFiles, title: "Dokumen" },
      { href: "/images", icon: IconPhoto, title: "Gambar" },
    ],
    title: "Utama",
  },
  {
    items: [
      {
        href: "/settings",
        icon: IconSettings,
        items: [
          { href: "/settings/profile", title: "Profil" },
          { href: "/settings/security", title: "Keamanan" },
        ],
        title: "Pengaturan",
      },
    ],
    title: "Akun",
  },
];
