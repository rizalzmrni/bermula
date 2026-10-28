import { z } from "@hono/zod-openapi";

/**
 * Path `/api/organizations/{organizationId}/...`. Keanggotaannya dicek
 * `requireOrganizationMember`; skema ini untuk validasi & dokumentasi.
 */
export const OrganizationParamsSchema = z.object({
  organizationId: z.uuid().openapi({
    param: { in: "path", name: "organizationId" },
  }),
});

export const ORGANIZATION_PATH = "/api/organizations/{organizationId}";
