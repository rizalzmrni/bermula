/** Query key data tagihan; dipakai bersama loader, `useQuery`, dan invalidasi. */
export const billingKeys = {
  all: ["billing"] as const,
  overview: (organizationId: string) =>
    [...billingKeys.all, "overview", organizationId] as const,
};
