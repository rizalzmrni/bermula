import { Container } from "@bermula/design-system/components/layout/container";
import { Logo } from "@bermula/design-system/components/layout/logo";
import { MainNav } from "@bermula/design-system/components/navigation/main-nav";
import { MobileNav } from "@bermula/design-system/components/navigation/mobile-nav";
import { ThemeToggle } from "@bermula/design-system/components/theme-toggle";
import type { NavItem } from "@bermula/design-system/lib/navigation";
import { cn } from "cn";
import type { ReactNode } from "react";

interface SiteHeaderProps {
  items: NavItem[];
  /** Slot kanan, mis. tombol "Masuk" / CTA. */
  actions?: ReactNode;
  /** Default `<Logo />`. */
  logo?: ReactNode;
  showThemeToggle?: boolean;
  className?: string;
}

/** Header situs: nav desktop di `md` ke atas, sheet nav mobile di bawahnya. */
export const SiteHeader = ({
  items,
  actions,
  logo,
  showThemeToggle = true,
  className,
}: SiteHeaderProps) => {
  const brand = logo ?? <Logo />;

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur",
        className
      )}
    >
      <Container className="flex h-14 items-center gap-2 md:gap-6">
        <MobileNav className="md:hidden" items={items} title={brand} />
        {brand}
        <MainNav className="hidden md:flex" items={items} />
        <div className="ml-auto flex items-center gap-2">
          {actions}
          {showThemeToggle ? <ThemeToggle /> : null}
        </div>
      </Container>
    </header>
  );
};
