import { APP_NAME } from "@bermula/core/brand";
import { Container } from "@bermula/design-system/components/layout/container";
import { Logo } from "@bermula/design-system/components/layout/logo";
import { NavItemLink } from "@bermula/design-system/components/navigation/nav-item-link";
import type { NavGroup, NavItem } from "@bermula/design-system/lib/navigation";
import { cn } from "cn";
import type { ReactNode } from "react";

const LINK_CLASS =
  "text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground aria-[current=page]:text-foreground";

interface SiteFooterProps {
  /** Kolom tautan, mis. Produk, Perusahaan, Legal. */
  groups?: NavGroup[];
  /** Tautan media sosial; tampil sebagai ikon bila `icon` diisi. */
  socialLinks?: NavItem[];
  /** Kalimat singkat di bawah logo. */
  description?: ReactNode;
  /** Default `<Logo />`. */
  logo?: ReactNode;
  /**
   * Tahun hak cipta. Wajib diisi dari loader app agar SSR dan hidrasi memakai
   * nilai yang sama (waktu "sekarang" disuntikkan, bukan dibaca saat render).
   */
  year: number;
  className?: string;
}

const SocialLink = ({ item }: { item: NavItem }) => {
  const Icon = item.icon;
  if (!Icon) {
    return (
      <NavItemLink className={LINK_CLASS} item={item}>
        {item.title}
      </NavItemLink>
    );
  }
  return (
    <NavItemLink aria-label={item.title} className={LINK_CLASS} item={item}>
      <Icon className="size-5" />
    </NavItemLink>
  );
};

const NO_GROUPS: NavGroup[] = [];
const NO_LINKS: NavItem[] = [];

export const SiteFooter = ({
  groups = NO_GROUPS,
  socialLinks = NO_LINKS,
  description,
  logo,
  year,
  className,
}: SiteFooterProps) => (
  <footer className={cn("bg-background border-t", className)}>
    <Container className="flex flex-col gap-10 py-10 md:flex-row md:justify-between">
      <div className="flex max-w-xs flex-col gap-3">
        {logo ?? <Logo />}
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {groups.length > 0 ? (
        <nav
          aria-label="Navigasi footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3"
        >
          {groups.map((group) => (
            <div className="flex flex-col gap-3" key={group.title}>
              <h2 className="text-foreground text-sm font-medium">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavItemLink className={LINK_CLASS} item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      ) : null}
    </Container>
    <Container className="flex flex-col-reverse gap-4 border-t py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        © {year} {APP_NAME}. Hak cipta dilindungi.
      </p>
      {socialLinks.length > 0 ? (
        <ul className="flex items-center gap-4">
          {socialLinks.map((item) => (
            <li key={item.href}>
              <SocialLink item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  </footer>
);
