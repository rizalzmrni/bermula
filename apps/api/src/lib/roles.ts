/** Role organisasi yang boleh mengelola data milik organisasi (file anggota lain, tagihan). */
export const ORGANIZATION_MANAGER_ROLES: ReadonlySet<string> = new Set([
  "owner",
  "admin",
]);

/** Role better-auth bisa berisi beberapa nilai dipisah koma (`member,admin`). */
export const hasOrganizationRole = (
  role: string,
  allowed: ReadonlySet<string>
) => role.split(",").some((value) => allowed.has(value.trim()));
