import type { RoleId } from "@/auth/role-ids";

/**
 * The roles given and taken in Pengguna dan peran, in the order shown.
 * Kepala Unit is not managed there, and the student role follows the
 * student record.
 */
export const MANAGED_ROLES = [
  "mentor",
  "discipline_officer",
  "counsellor",
  "assessor",
  "upk_staff",
  "dorm_manager",
  "bam_bphk",
  "bam_compliance",
  "bam_household",
  "bam_spiritual",
  "bam_catering",
  "bam_arts_sports",
  "bam_health",
  "head_of_program",
  "director",
] as const satisfies readonly RoleId[];

export type ManagedRole = (typeof MANAGED_ROLES)[number];

export function isManagedRole(role: string): role is ManagedRole {
  return (MANAGED_ROLES as readonly string[]).includes(role);
}

/**
 * The roles of the accounts listed in Pengguna dan peran: every staff
 * account. Kepala Unit is listed but not given or taken there, and
 * student-only accounts are not listed.
 */
export const LISTED_ROLES = [
  "head_of_unit",
  ...MANAGED_ROLES,
] as const satisfies readonly RoleId[];

export type ListedRole = (typeof LISTED_ROLES)[number];

export function isListedRole(role: string): role is ListedRole {
  return (LISTED_ROLES as readonly string[]).includes(role);
}
