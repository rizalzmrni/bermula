import { AppShell } from "@bermula/design-system/components/layout/app-shell";
import type { NavGroup } from "@bermula/design-system/lib/navigation";
import { readSidebarOpen } from "@bermula/design-system/lib/sidebar-state";
import { IconHome, IconShieldLock } from "@tabler/icons-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Outlet } from "react-router";

import { useAccount } from "../features/account/queries";
import { UserMenu } from "../features/auth/user-menu";
import { getQueryClient } from "../lib/query-client";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/app-layout";

const NAVIGATION: NavGroup[] = [
  { items: [{ href: "/", icon: IconHome, title: "Beranda" }], title: "Menu" },
  {
    items: [
      { href: "/settings/security", icon: IconShieldLock, title: "Keamanan" },
    ],
    title: "Pengaturan",
  },
];

/**
 * Auth gate + prefetch akun untuk semua halaman terproteksi. Akun dikirim
 * sebagai state TanStack Query (bukan field loader), lalu dibaca halaman
 * lewat `useAccount()`. Setiap revalidasi (mis. setelah action) mengirim
 * state baru yang menimpa cache browser.
 */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  return {
    dehydratedState: dehydrate(getQueryClient(context)),
    sidebarOpen: readSidebarOpen(request.headers.get("Cookie")),
  };
};

const AccountUserMenu = () => <UserMenu user={useAccount().user} />;

const AppLayout = ({ loaderData }: Route.ComponentProps) => (
  <HydrationBoundary state={loaderData.dehydratedState}>
    <AppShell
      defaultOpen={loaderData.sidebarOpen}
      groups={NAVIGATION}
      sidebarFooter={<AccountUserMenu />}
    >
      <Outlet />
    </AppShell>
  </HydrationBoundary>
);

export default AppLayout;
