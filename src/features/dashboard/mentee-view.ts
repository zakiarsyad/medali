import type { Database } from "@/db/connect";
import { countMentees, readMenteeGroups } from "./mentee-groups";
import type { MenteeDashboard } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";

/**
 * Reads Dashboard anak asuh of a scope on each load, so a student who
 * left a group, or a group handed to another Pengasuh, is gone at once.
 */
export async function loadMenteeDashboard(
  db: Database,
  scope: MenteeScope,
): Promise<MenteeDashboard> {
  const groups = await readMenteeGroups(db, scope.mentorIds);
  if (groups.length === 0) return { kind: "no_group" };
  const students = await countMentees(db, scope.mentees);
  return { kind: "shown", groups, students };
}
