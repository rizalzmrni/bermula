import { z } from "zod";

/**
 * Aturan organisasi bersama form di app (umpan balik instan) dan hook
 * better-auth di server (validasi sebelum disimpan).
 */

/** Role bawaan plugin organization better-auth. */
export const ORGANIZATION_ROLE = {
  admin: "admin",
  member: "member",
  owner: "owner",
} as const;

export type OrganizationRole =
  (typeof ORGANIZATION_ROLE)[keyof typeof ORGANIZATION_ROLE];

/** Role yang bisa diberikan lewat undangan atau ubah role; owner hanya dari pembuat. */
export const ASSIGNABLE_ROLES = [
  ORGANIZATION_ROLE.admin,
  ORGANIZATION_ROLE.member,
] as const;

export const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES);

export const ORGANIZATION_MANAGER_ROLES: ReadonlySet<string> = new Set([
  ORGANIZATION_ROLE.owner,
  ORGANIZATION_ROLE.admin,
]);

/** Role better-auth bisa berisi beberapa nilai dipisah koma (`member,admin`). */
export const hasOrganizationRole = (
  role: string,
  allowed: ReadonlySet<string>
) => role.split(",").some((value) => allowed.has(value.trim()));

export const isOrganizationManager = (role: string) =>
  hasOrganizationRole(role, ORGANIZATION_MANAGER_ROLES);

export const isOrganizationOwner = (role: string) =>
  hasOrganizationRole(role, new Set([ORGANIZATION_ROLE.owner]));

export const ORGANIZATION_NAME_MAX_LENGTH = 64;
export const ORGANIZATION_SLUG_MIN_LENGTH = 3;
export const ORGANIZATION_SLUG_MAX_LENGTH = 48;

// Huruf kecil, angka, dan `-` di tengah; aman dipakai langsung di URL `/o/:slug`.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/gu;
const EDGE_DASHES = /^-+|-+$/gu;
const DIACRITICS = /\p{Diacritic}/gu;

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Nama organisasi wajib diisi.")
  .max(
    ORGANIZATION_NAME_MAX_LENGTH,
    `Nama organisasi maksimal ${ORGANIZATION_NAME_MAX_LENGTH} karakter.`
  );

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(
    ORGANIZATION_SLUG_MIN_LENGTH,
    `Alamat minimal ${ORGANIZATION_SLUG_MIN_LENGTH} karakter.`
  )
  .max(
    ORGANIZATION_SLUG_MAX_LENGTH,
    `Alamat maksimal ${ORGANIZATION_SLUG_MAX_LENGTH} karakter.`
  )
  .regex(
    SLUG_PATTERN,
    "Gunakan huruf kecil, angka, dan tanda hubung (-) di antara kata."
  );

export const organizationInputSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
});

export type OrganizationInput = z.infer<typeof organizationInputSchema>;

/** Saran slug dari nama: "Toko Ánda & Co." → "toko-anda-co". */
export const toOrganizationSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replaceAll(DIACRITICS, "")
    .toLowerCase()
    .replaceAll(NON_SLUG_CHARACTERS, "-")
    .replaceAll(EDGE_DASHES, "")
    .slice(0, ORGANIZATION_SLUG_MAX_LENGTH)
    .replaceAll(EDGE_DASHES, "");

export const inviteMemberSchema = z.object({
  // Dirapikan dulu: `z.email()` memvalidasi sebelum transformasi berantai.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Masukkan alamat email yang valid.")),
  role: assignableRoleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
