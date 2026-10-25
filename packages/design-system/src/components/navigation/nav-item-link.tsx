import type { NavItem } from "@bermula/design-system/lib/navigation";
import type { ComponentProps } from "react";
import { NavLink } from "react-router";

type NavItemLinkProps = Omit<ComponentProps<"a">, "href"> & {
  item: NavItem;
};

/**
 * Tautan untuk satu `NavItem`: `NavLink` untuk path internal (memberi
 * `aria-current="page"` saat aktif, gayakan dengan `aria-[current=page]:`),
 * `<a target="_blank">` untuk tautan eksternal.
 */
export const NavItemLink = ({ item, children, ...props }: NavItemLinkProps) => {
  const content = children ?? item.title;

  if (item.external) {
    return (
      <a {...props} href={item.href} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    // `end` untuk beranda agar "/" tidak ikut aktif di semua halaman.
    <NavLink {...props} end={item.href === "/"} to={item.href}>
      {content}
    </NavLink>
  );
};
