import { AnalyticsIdentify } from "@bermula/analytics/analytics-provider";
import { AppShell } from "@bermula/design-system/components/layout/app-shell";
import type { NavGroup } from "@bermula/design-system/lib/navigation";
import { readSidebarOpen } from "@bermula/design-system/lib/sidebar-state";
import {
  IconCookie,
  IconCreditCard,
  IconHome,
  IconSettings,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router";

import { useAccount } from "../features/account/queries";
import { UserMenu } from "../features/auth/user-menu";
import { OrganizationSwitcher } from "../features/organizations/organization-switcher";
import {
  organizationsQueryOptions,
  useOrganizations,
} from "../features/organizations/queries";
import { getQueryClient } from "../lib/query-client";
import { getServerApiClient, requireSession } from "../lib/session.server";
import type { Route } from "./+types/app-layout";

/** Menu dashboard pribadi (`/`): data dan pengaturan milik pengguna sendiri. */
const PERSONAL_NAVIGATION: NavGroup[] = [
  { items: [{ href: "/", icon: IconHome, title: "Beranda" }], title: "Menu" },
  {
    items: [
      { href: "/settings/security", icon: IconShieldLock, title: "Keamanan" },
      { href: "/settings/billing", icon: IconCreditCard, title: "Tagihan" },
      { href: "/settings/cookies", icon: IconCookie, title: "Cookie" },
    ],
    title: "Pengaturan",
  },
];

/** Menu dashboard organisasi (`/o/:slug`); konteksnya dari URL, bukan sesi. */
const getOrganizationNavigation = (slug: string): NavGroup[] => {
  const base = `/o/${slug}`;
  return [
    {
      items: [
        { end: true, href: base, icon: IconHome, title: "Beranda" },
        { href: `${base}/members`, icon: IconUsers, title: "Anggota" },
        { href: `${base}/settings`, icon: IconSettings, title: "Pengaturan" },
      ],
      title: "Organisasi",
    },
  ];
};

/**
 * Auth gate + prefetch akun untuk semua halaman terproteksi. Akun dikirim
 * sebagai state TanStack Query (bukan field loader), lalu dibaca halaman
 * lewat `useAccount()`. Setiap revalidasi (mis. setelah action) mengirim
 * state baru yang menimpa cache browser.
 */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  // Untuk pemilih organisasi; `prefetchQuery` tidak melempar, jadi bila api
  // gagal, sidebar tetap tampil dengan state error di pemilih.
  await getQueryClient(context).prefetchQuery(
    organizationsQueryOptions(getServerApiClient({ context, request }))
  );
  return {
    dehydratedState: dehydrate(getQueryClient(context)),
    sidebarOpen: readSidebarOpen(request.headers.get("Cookie")),
  };
};

const AccountUserMenu = () => <UserMenu user={useAccount().user} />;

const AccountSwitcher = ({ slug }: { slug: string | undefined }) => (
  <OrganizationSwitcher currentSlug={slug} user={useAccount().user} />
);

/**
 * Event PostHog terkait pengguna, dan organisasi yang sedang dibuka di URL
 * (bila disetujui). Di dashboard pribadi event tidak dikelompokkan ke organisasi.
 */
const AccountAnalytics = ({ slug }: { slug: string | undefined }) => {
  const { user } = useAccount();
  const organization = useOrganizations().data?.find(
    (item) => item.slug === slug
  );
  return (
    <AnalyticsIdentify
      organization={
        organization ? { id: organization.id, name: organization.name } : null
      }
      userId={user.id}
    />
  );
};

const AppLayout = ({ loaderData }: Route.ComponentProps) => {
  // `/o/:slug/*` = dashboard organisasi; selain itu dashboard pribadi.
  const { slug } = useParams();

  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <AppShell
        defaultOpen={loaderData.sidebarOpen}
        groups={slug ? getOrganizationNavigation(slug) : PERSONAL_NAVIGATION}
        sidebarFooter={<AccountUserMenu />}
        sidebarHeader={<AccountSwitcher slug={slug} />}
      >
        <AccountAnalytics slug={slug} />
        <Outlet />
      </AppShell>
    </HydrationBoundary>
  );
};

export default AppLayout;
