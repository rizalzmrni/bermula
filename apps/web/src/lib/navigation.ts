import type { NavGroup, NavItem } from "@bermula/design-system/lib/navigation";

import { APP_PATHS, PATHS } from "./paths";
import { appLink } from "./site";

export const HEADER_ITEMS: NavItem[] = [
  { href: PATHS.home, title: "Beranda" },
  { href: PATHS.pricing, title: "Harga" },
];

// Tautan apps/app bukan `external`: tetap dibuka di tab yang sama karena
// masih produk yang sama, hanya beda origin.
export const getFooterGroups = (): NavGroup[] => [
  {
    items: [
      { href: PATHS.home, title: "Beranda" },
      { href: PATHS.pricing, title: "Harga" },
    ],
    title: "Produk",
  },
  {
    items: [
      { href: PATHS.privacy, title: "Kebijakan Privasi" },
      { href: PATHS.terms, title: "Syarat & Ketentuan" },
    ],
    title: "Legal",
  },
  {
    items: [
      { href: appLink(APP_PATHS.signIn), title: "Masuk" },
      { href: appLink(APP_PATHS.signUp), title: "Daftar" },
    ],
    title: "Akun",
  },
];
