import { ORGANIZATION_ROLE } from "@bermula/core/organizations";

const ROLE_LABELS: Record<string, string> = {
  [ORGANIZATION_ROLE.admin]: "Admin",
  [ORGANIZATION_ROLE.member]: "Anggota",
  [ORGANIZATION_ROLE.owner]: "Pemilik",
};

/** Label role untuk UI; role ganda (`member,admin`) digabung, role khusus apa adanya. */
export const formatRole = (role: string) =>
  role
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ROLE_LABELS[value] ?? value)
    .join(", ");
