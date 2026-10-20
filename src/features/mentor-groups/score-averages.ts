import { rerataTenths } from "@/character-scores/assessment-score";

/*
 * The averages of the character scores of a group or of a mentor's
 * mentees. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** Assessed active members whose latest six scores have the same total. */
export interface SameTotal {
  total: number;
  students: number;
}

/**
 * "Rerata MEDALI" of a group, or "Rerata" of a mentor: the average of the
 * Rerata of each assessed active member, to one decimal. Null when nobody
 * is assessed.
 */
export function averageRerata(members: readonly SameTotal[]): number | null {
  let students = 0;
  let tenths = 0;
  for (const member of members) {
    students += member.students;
    tenths += rerataTenths(member.total) * member.students;
  }
  if (students === 0) return null;
  return Math.round(tenths / students) / 10;
}
