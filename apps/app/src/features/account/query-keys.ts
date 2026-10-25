/** Query key data akun; dipakai bersama loader, `useQuery`, dan invalidasi. */
export const accountKeys = {
  all: ["account"] as const,
  current: () => [...accountKeys.all, "current"] as const,
};
