/**
 * Every role in the app. A person may hold several; there is never a role
 * that combines two others.
 */
export const ROLE_IDS = [
  "head_of_unit",
  "director",
  "head_of_program",
  "mentor",
  "student",
  "dorm_manager",
  "bam_bphk",
  "bam_compliance",
  "bam_household",
  "bam_spiritual",
  "bam_catering",
  "bam_arts_sports",
  "bam_health",
  "upk_staff",
  "counsellor",
  "discipline_officer",
  "assessor",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];
