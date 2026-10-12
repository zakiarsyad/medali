import type { mentorGroups } from "@/db/schema";

type MentorGroup = typeof mentorGroups.$inferSelect;

export type GroupCodeParts = Pick<
  MentorGroup,
  "cohortYear" | "entryPath" | "number"
> & {
  /** The code of the group's study program, such as D3PJK. */
  programCode: string;
};

/**
 * The code a kelompok pengasuhan is shown by, such as "KP 24-D3PJK-01".
 * A group of the alih program jalur has "AJ" before its number.
 */
export function groupCode(group: GroupCodeParts): string {
  const cohort = String(group.cohortYear).slice(-2);
  const number = String(group.number).padStart(2, "0");
  if (group.entryPath === "transfer") {
    return `KP ${cohort}-${group.programCode}-AJ-${number}`;
  }
  return `KP ${cohort}-${group.programCode}-${number}`;
}
