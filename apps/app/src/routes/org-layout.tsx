import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Outlet } from "react-router";

import { requireOrganization } from "../features/organizations/organization.server";
import { getQueryClient } from "../lib/query-client";
import { requireSession } from "../lib/session.server";
import type { Route } from "./+types/org-layout";

/**
 * Gerbang `/o/:slug/*`: sesi wajib dan slug harus organisasi milik pengguna
 * (404 bila tidak). Halaman di bawahnya membaca organisasinya lewat
 * `useCurrentOrganization(slug)` dari cache yang di-hydrate di sini.
 */
export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  await requireSession({ context, request });
  await requireOrganization({ context, request, slug: params.slug });
  return { dehydratedState: dehydrate(getQueryClient(context)) };
};

const OrganizationLayout = ({ loaderData }: Route.ComponentProps) => (
  <HydrationBoundary state={loaderData.dehydratedState}>
    <Outlet />
  </HydrationBoundary>
);

export default OrganizationLayout;
