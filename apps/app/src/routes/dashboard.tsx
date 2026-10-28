import { APP_NAME } from "@bermula/core/brand";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { useAccount } from "../features/account/queries";
import {
  InvitationsCard,
  OrganizationsCard,
} from "../features/organizations/personal-dashboard-cards";
import { myInvitationsQueryOptions } from "../features/organizations/queries";
import { getQueryClient } from "../lib/query-client";
import { getServerApiClient, requireSession } from "../lib/session.server";
import type { Route } from "./+types/dashboard";

export const meta = () => [{ title: `Beranda — ${APP_NAME}` }];

/** Daftar organisasi sudah di-prefetch layout; di sini undangan masuk. */
export const loader = async ({ request, context }: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const queryClient = getQueryClient(context);
  await queryClient.prefetchQuery(
    myInvitationsQueryOptions(getServerApiClient({ context, request }))
  );
  return { dehydratedState: dehydrate(queryClient) };
};

/** Dashboard pribadi: milik pengguna sendiri, terpisah dari dashboard organisasi. */
const DashboardPage = ({ loaderData }: Route.ComponentProps) => {
  const { name } = useAccount().user;

  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Halo, {name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Dashboard pribadi Anda. Buka organisasi untuk bekerja bersama tim.
          </p>
        </div>
        <InvitationsCard />
        <OrganizationsCard />
      </div>
    </HydrationBoundary>
  );
};

export default DashboardPage;
