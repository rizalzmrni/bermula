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
  /**
   * Aktif hanya bila path persis sama, bukan juga turunannya. Default `true`
   * untuk `/`; pakai untuk beranda bagian lain, mis. `/o/toko-a`.
   */
  end?: boolean;
  /** Buka di tab baru dengan `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Sub-menu: dropdown di desktop, grup di nav mobile. */
  items?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
