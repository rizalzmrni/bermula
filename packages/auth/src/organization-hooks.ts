import {
  organizationNameSchema,
  organizationSlugSchema,
} from "@bermula/core/organizations";
import { APIError } from "better-auth/api";

/**
 * Validasi server untuk endpoint organisasi better-auth. Form di app memakai
 * skema yang sama; hook ini menjaga request yang langsung ke api.
 */

interface OrganizationFields {
  name?: string;
  slug?: string;
}

// Kedua skema berupa string Zod; tipe diambil dari core agar paket ini tidak
// perlu bergantung langsung pada zod.
type StringFieldSchema =
  | typeof organizationNameSchema
  | typeof organizationSlugSchema;

const parseField = (schema: StringFieldSchema, value: unknown): string => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_ORGANIZATION_INPUT",
      message: result.error.issues[0]?.message ?? "Invalid organization input",
    });
  }
  return result.data;
};

/** Nama dan slug wajib saat membuat; nilai yang dirapikan (trim) disimpan. */
export const validateNewOrganization = (organization: OrganizationFields) => ({
  name: parseField(organizationNameSchema, organization.name),
  slug: parseField(organizationSlugSchema, organization.slug),
});

/** Saat mengubah, hanya field yang dikirim yang divalidasi. */
export const validateOrganizationUpdate = (
  organization: OrganizationFields
): OrganizationFields => ({
  ...(organization.name === undefined
    ? {}
    : { name: parseField(organizationNameSchema, organization.name) }),
  ...(organization.slug === undefined
    ? {}
    : { slug: parseField(organizationSlugSchema, organization.slug) }),
});
