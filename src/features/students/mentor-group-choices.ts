import { and, asc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMentors,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { MEMBERS } from "@/mentoring/member-count";
import type { GroupCodeParts } from "@/ui/group-code";

/** A kelompok pengasuhan the student form may offer. */
export interface GroupChoice extends GroupCodeParts {
  id: string;
  studyProgramId: number;
  /** The mentor of today. Null for a group that has none. */
  mentorName: string | null;
  /** How many Aktif students the group holds. */
  members: number;
}

const CHOICE = {
  id: mentorGroups.id,
  studyProgramId: mentorGroups.studyProgramId,
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
  mentorName: accounts.name,
  members: MEMBERS,
};

const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroups.id),
  isNull(mentorGroupMentors.endsOn),
);

/**
 * Every group in force, in the order of its number, in one read. The form
 * keeps the ones of the angkatan, program studi and jalur chosen in it.
 */
export function listGroupChoices(db: Database): Promise<GroupChoice[]> {
  return db
    .select(CHOICE)
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(NOT_ENDED)
    .orderBy(asc(mentorGroups.number));
}
