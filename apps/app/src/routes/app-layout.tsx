import { AppShell } from "@bermula/design-system/components/layout/app-shell";
import type { NavGroup } from "@bermula/design-system/lib/navigation";
import { readSidebarOpen } from "@bermula/design-system/lib/sidebar-state";
import { IconHome } from "@tabler/icons-react";
import { Outlet } from "react-router";

import { UserMenu } from "../features/auth/user-menu";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/app-layout";

const NAVIGATION: NavGroup[] = [
  { items: [{ href: "/", icon: IconHome, title: "Beranda" }], title: "Menu" },
];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const account = await requireSession({ context, request });
  return {
    account,
    sidebarOpen: readSidebarOpen(request.headers.get("Cookie")),
  };
};

const AppLayout = ({ loaderData }: Route.ComponentProps) => (
  <AppShell
    defaultOpen={loaderData.sidebarOpen}
    groups={NAVIGATION}
    sidebarFooter={<UserMenu user={loaderData.account.user} />}
  >
    <Outlet />
  </AppShell>
);

export default AppLayout;
