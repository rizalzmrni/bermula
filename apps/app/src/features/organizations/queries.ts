import { HttpError } from "@bermula/data/query-client";
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";

import { getBrowserApiClient } from "../../lib/api-client";
import type { ApiClient } from "../../lib/api-client";
import { organizationKeys } from "./query-keys";

type OrganizationApi = ApiClient["api"]["organizations"][":organizationId"];

/** Organisasi yang diikuti pengguna, dari `GET /api/me/organizations`. */
export type Organization = InferResponseType<
  ApiClient["api"]["me"]["organizations"]["$get"],
  200
>[number];

export type UserInvitation = InferResponseType<
  ApiClient["api"]["me"]["invitations"]["$get"],
  200
>[number];

export type Member = InferResponseType<
  OrganizationApi["members"]["$get"],
  200
>[number];

export type OrganizationInvitation = InferResponseType<
  OrganizationApi["invitations"]["$get"],
  200
>[number];

// Selain 200, status dilempar sebagai `HttpError` agar loader dan komponen
// bisa membedakan 401/404 dari kegagalan lain.

export const fetchOrganizations = async (
  client: ApiClient
): Promise<Organization[]> => {
  const response = await client.api.me.organizations.$get();
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

export const fetchMyInvitations = async (
  client: ApiClient
): Promise<UserInvitation[]> => {
  const response = await client.api.me.invitations.$get();
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

export const fetchMembers = async (
  client: ApiClient,
  organizationId: string
): Promise<Member[]> => {
  const response = await client.api.organizations[
    ":organizationId"
  ].members.$get({ param: { organizationId } });
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

export const fetchOrganizationInvitations = async (
  client: ApiClient,
  organizationId: string
): Promise<OrganizationInvitation[]> => {
  const response = await client.api.organizations[
    ":organizationId"
  ].invitations.$get({ param: { organizationId } });
  if (response.status === 200) {
    return await response.json();
  }
  throw new HttpError(response.status);
};

export const organizationsQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryFn: () => fetchOrganizations(client),
    queryKey: organizationKeys.list(),
  });

export const myInvitationsQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryFn: () => fetchMyInvitations(client),
    queryKey: organizationKeys.myInvitations(),
  });

export const membersQueryOptions = (
  client: ApiClient,
  organizationId: string
) =>
  queryOptions({
    queryFn: () => fetchMembers(client, organizationId),
    queryKey: organizationKeys.members(organizationId),
  });

export const organizationInvitationsQueryOptions = (
  client: ApiClient,
  organizationId: string
) =>
  queryOptions({
    queryFn: () => fetchOrganizationInvitations(client, organizationId),
    queryKey: organizationKeys.invitations(organizationId),
  });

/** Pemilih organisasi: `useQuery` agar sidebar tetap tampil bila api gagal. */
export const useOrganizations = () =>
  useQuery(organizationsQueryOptions(getBrowserApiClient()));

/**
 * Organisasi dari `:slug` di halaman `/o/:slug/*`. Loader `org-layout` sudah
 * memastikan daftarnya ada dan slug-nya milik pengguna (404 bila tidak).
 */
export const useCurrentOrganization = (slug: string) => {
  const { data } = useSuspenseQuery(
    organizationsQueryOptions(getBrowserApiClient())
  );
  const organization = data.find((item) => item.slug === slug);
  if (!organization) {
    throw new Error(`Organization ${slug} is not in the cached list`);
  }
  return organization;
};

export const useMyInvitations = () =>
  useQuery(myInvitationsQueryOptions(getBrowserApiClient()));

export const useMembers = (organizationId: string) =>
  useQuery(membersQueryOptions(getBrowserApiClient(), organizationId));

export const useOrganizationInvitations = (
  organizationId: string,
  { enabled }: { enabled: boolean }
) =>
  useQuery({
    ...organizationInvitationsQueryOptions(
      getBrowserApiClient(),
      organizationId
    ),
    enabled,
  });
