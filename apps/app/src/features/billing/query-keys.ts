/** Query key data tagihan; dipakai bersama loader, `useQuery`, dan invalidasi. */
export const billingKeys = {
  all: ["billing"] as const,
  overview: () => [...billingKeys.all, "overview"] as const,
};
