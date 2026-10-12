import type { RoleId } from "./role-ids";

/** The roles of Badan Asrama Mahasiswa, held by students, in role order. */
export const BAM_ROLES = [
  "bam_bphk",
  "bam_compliance",
  "bam_household",
  "bam_spiritual",
  "bam_catering",
  "bam_arts_sports",
  "bam_health",
] as const satisfies readonly RoleId[];

export type BamRole = (typeof BAM_ROLES)[number];

export function isBamRole(role: string): role is BamRole {
  return (BAM_ROLES as readonly string[]).includes(role);
}
