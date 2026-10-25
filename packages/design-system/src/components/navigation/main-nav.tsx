import { NavItemLink } from "@bermula/design-system/components/navigation/nav-item-link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@bermula/design-system/components/ui/navigation-menu";
import type { NavItem } from "@bermula/design-system/lib/navigation";
import { cn } from "cn";

const ACTIVE_LINK_CLASS =
  "text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground";

interface MainNavProps {
  items: NavItem[];
  className?: string;
}

const DropdownLink = ({ item }: { item: NavItem }) => {
  const Icon = item.icon;
  return (
    <li>
      <NavigationMenuLink
        className="items-start"
        render={<NavItemLink item={item} />}
      >
        {Icon ? <Icon className="mt-0.5 shrink-0" /> : null}
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{item.title}</span>
          {item.description ? (
            <span className="text-muted-foreground">{item.description}</span>
          ) : null}
        </span>
      </NavigationMenuLink>
    </li>
  );
};

/** Navigasi desktop; item dengan `items` tampil sebagai dropdown. */
export const MainNav = ({ items, className }: MainNavProps) => (
  <NavigationMenu aria-label="Navigasi utama" className={className}>
    <NavigationMenuList className="gap-1">
      {items.map((item) => (
        <NavigationMenuItem key={item.href}>
          {item.items?.length ? (
            <>
              <NavigationMenuTrigger className={ACTIVE_LINK_CLASS}>
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-72 gap-1 p-1">
                  {item.items.map((child) => (
                    <DropdownLink item={child} key={child.href} />
                  ))}
                </ul>
              </NavigationMenuContent>
            </>
          ) : (
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), ACTIVE_LINK_CLASS)}
              render={<NavItemLink item={item} />}
            >
              {item.title}
            </NavigationMenuLink>
          )}
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);
