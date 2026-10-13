import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorGroups, studyPrograms } from "@/db/schema";
import { MEMBERS } from "@/mentoring/member-count";
import type { GroupCodeParts } from "@/ui/group-code";
import { heldTodayBy } from "./visible-mentors";

/** A group a mentor holds today. */
export interface HeldGroup extends GroupCodeParts {
  id: string;
  mentorId: string;
  /** How many Aktif students the group holds. */
  members: number;
}

const HELD_GROUP = {
  id: mentorGroups.id,
  mentorId: mentorGroupMentors.mentorId,
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
  members: MEMBERS,
};

/**
 * The groups these mentors hold today, among those an account with this
 * limit may see, in one read for all of them: the newest angkatan first,
 * as the list of groups has them.
 */
export async function readGroupsHeld(
  db: Database,
  limit: RowLimit,
  mentorIds: string[],
): Promise<HeldGroup[]> {
  if (mentorIds.length === 0) return [];
  return db
    .select(HELD_GROUP)
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(
      and(inArray(mentorGroupMentors.mentorId, mentorIds), heldTodayBy(limit)),
    )
    .orderBy(
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.name),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
}

/** How many Aktif students the groups hold together. */
export function studentsIn(groups: Pick<HeldGroup, "members">[]): number {
  let students = 0;
  for (const group of groups) students += group.members;
  return students;
}
