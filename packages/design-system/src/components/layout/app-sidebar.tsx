import { Logo } from "@bermula/design-system/components/layout/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@bermula/design-system/components/ui/sidebar";
import type { NavGroup, NavItem } from "@bermula/design-system/lib/navigation";
import type { ReactNode } from "react";
import { NavLink, useMatch, useResolvedPath } from "react-router";

/** "/" (dan item ber-`end`) hanya aktif persis; item lain juga di turunannya. */
const isExactMatch = (item: NavItem) => item.end ?? item.href === "/";

const useIsActive = (item: NavItem) => {
  const { pathname } = useResolvedPath(item.href);
  return useMatch({ end: isExactMatch(item), path: pathname }) !== null;
};

// Elemen `render` Base UI: props tombol (kelas, anak, data-active) digabung ke NavLink.
const itemLink = (item: NavItem) => (
  <NavLink end={isExactMatch(item)} to={item.href} />
);

const SubItem = ({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) => {
  const active = useIsActive(item);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={active}
        onClick={onNavigate}
        render={itemLink(item)}
      >
        <span>{item.title}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
};

const Item = ({ item }: { item: NavItem }) => {
  const active = useIsActive(item);
  const { isMobile, setOpenMobile } = useSidebar();
  // Sheet mobile menutupi konten, jadi ditutup setelah pengguna memilih menu.
  const closeOnMobile = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={closeOnMobile}
        render={itemLink(item)}
        tooltip={item.title}
      >
        {Icon ? <Icon /> : null}
        <span>{item.title}</span>
      </SidebarMenuButton>
      {item.items?.length ? (
        <SidebarMenuSub>
          {item.items.map((child) => (
            <SubItem item={child} key={child.href} onNavigate={closeOnMobile} />
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
};

interface AppSidebarProps {
  groups: NavGroup[];
  /** Default `<Logo />`; mis. pemilih organisasi. */
  header?: ReactNode;
  /** Mis. menu pengguna (dibuat di app karena membaca sesi). */
  footer?: ReactNode;
}

/**
 * Sidebar area aplikasi: bisa dilipat menjadi ikon (Ctrl/⌘+B), menjadi sheet
 * di mobile. Item internal saja; ikon wajib agar tetap terbaca saat terlipat.
 */
export const AppSidebar = ({ groups, header, footer }: AppSidebarProps) => (
  <Sidebar collapsible="icon">
    <SidebarHeader>
      {header ?? (
        <Logo className="h-8 px-1 group-data-[collapsible=icon]:[&>span:last-child]:sr-only" />
      )}
    </SidebarHeader>
    <SidebarContent>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <Item item={item} key={item.href} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
    {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
    <SidebarRail />
  </Sidebar>
);
