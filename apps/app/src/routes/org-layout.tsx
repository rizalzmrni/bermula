import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Outlet } from "react-router";

import { CurrentOrganizationProvider } from "../features/organizations/current-organization";
import { requireOrganization } from "../features/organizations/organization.server";
import { getQueryClient } from "../lib/query-client";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/org-layout";

/**
 * Gerbang `/o/:slug/*`: sesi wajib dan slug harus organisasi milik pengguna
 * (404 bila tidak). Halaman di bawahnya membaca organisasinya lewat
 * `useCurrentOrganization()`, diisi dari loader ini.
 */
export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  await requireSession({ context, request });
  const organization = await requireOrganization({
    context,
    request,
    slug: params.slug,
  });
  return { dehydratedState: dehydrate(getQueryClient(context)), organization };
};

const OrganizationLayout = ({ loaderData }: Route.ComponentProps) => (
  <HydrationBoundary state={loaderData.dehydratedState}>
    <CurrentOrganizationProvider value={loaderData.organization}>
      <Outlet />
    </CurrentOrganizationProvider>
  </HydrationBoundary>
);

export default OrganizationLayout;
