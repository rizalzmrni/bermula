import { createContext, use } from "react";

import type { Organization } from "./queries";

const CurrentOrganizationContext = createContext<Organization | null>(null);

/**
 * Diisi `org-layout` dari loader-nya, bukan dari cache TanStack Query: setelah
 * action redirect (buat organisasi, ganti slug), `HydrationBoundary` baru
 * memperbarui query yang sudah ada di cache setelah render pertama, sehingga
 * daftar organisasi di cache browser masih versi lama saat halaman dirender.
 */
export const CurrentOrganizationProvider = CurrentOrganizationContext;

/** Organisasi dari `:slug` di halaman `/o/:slug/*`, sudah dicek loader `org-layout`. */
export const useCurrentOrganization = (): Organization => {
  const organization = use(CurrentOrganizationContext);
  if (!organization) {
    throw new Error("useCurrentOrganization must be used inside org-layout");
  }
  return organization;
};
