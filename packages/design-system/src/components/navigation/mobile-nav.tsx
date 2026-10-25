import { NavItemLink } from "@bermula/design-system/components/navigation/nav-item-link";
import { Button } from "@bermula/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@bermula/design-system/components/ui/sheet";
import type { NavItem } from "@bermula/design-system/lib/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import { useState } from "react";
import type { ReactNode } from "react";

const LINK_CLASS =
  "flex items-center gap-2 rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground [&_svg]:size-4";

interface MobileNavProps {
  items: NavItem[];
  /** Isi kepala sheet (mis. `<Logo />`); default teks "Menu". */
  title?: ReactNode;
  className?: string;
}

const MobileNavLink = ({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) => {
  const Icon = item.icon;
  return (
    <NavItemLink className={LINK_CLASS} item={item} onClick={onNavigate}>
      {Icon ? <Icon /> : null}
      {item.title}
    </NavItemLink>
  );
};

/** Navigasi layar kecil di dalam sheet; tutup otomatis setelah memilih tautan. */
export const MobileNav = ({
  items,
  title = "Menu",
  className,
}: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={<Button className={className} size="icon" variant="ghost" />}
      >
        <IconMenu2 />
        <span className="sr-only">Buka menu navigasi</span>
      </SheetTrigger>
      <SheetContent className="gap-0" side="left">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <nav
          aria-label="Navigasi utama"
          className="flex flex-col gap-4 px-4 pb-6"
        >
          {items.map((item) =>
            item.items?.length ? (
              <div className="flex flex-col gap-1" key={item.href}>
                <p className="text-muted-foreground px-2 text-xs font-medium">
                  {item.title}
                </p>
                {item.items.map((child) => (
                  <MobileNavLink
                    item={child}
                    key={child.href}
                    onNavigate={close}
                  />
                ))}
              </div>
            ) : (
              <MobileNavLink item={item} key={item.href} onNavigate={close} />
            )
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
