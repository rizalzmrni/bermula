import type { ComponentType } from "react";

export type NavIcon = ComponentType<{ className?: string }>;

/**
 * Satu entri menu. Dipakai bersama oleh header, nav mobile, footer, dan
 * sidebar agar struktur menu cukup didefinisikan sekali per app.
 */
export interface NavItem {
  title: string;
  /** Path internal (`/harga`) atau URL lengkap bila `external`. Unik per daftar. */
  href: string;
  /** Teks pendek di bawah judul (dropdown navigasi utama). */
  description?: string;
  icon?: NavIcon;
  /** Buka di tab baru dengan `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Sub-menu: dropdown di desktop, grup di nav mobile. */
  items?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
