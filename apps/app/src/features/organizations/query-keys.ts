/** Query key data organisasi; dipakai bersama loader, `useQuery`, dan invalidasi. */
export const organizationKeys = {
  all: ["organizations"] as const,
  invitations: (organizationId: string) =>
    [...organizationKeys.all, organizationId, "invitations"] as const,
  list: () => [...organizationKeys.all, "list"] as const,
  members: (organizationId: string) =>
    [...organizationKeys.all, organizationId, "members"] as const,
  myInvitations: () => [...organizationKeys.all, "my-invitations"] as const,
};
