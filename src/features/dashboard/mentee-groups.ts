import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  type SQL,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import type { MenteeGroup } from "./mentee-recap";

/**
 * The groups in force these mentors hold today, the newest angkatan
 * first, as the list of groups has them. A group handed to another
 * mentor is held by them, and gone from here.
 */
export function readMenteeGroups(
  db: Database,
  mentorIds: readonly string[],
): Promise<MenteeGroup[]> {
  if (mentorIds.length === 0) return Promise.resolve([]);
  return db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
    })
    .from(mentorGroupMentors)
    .innerJoin(
      mentorGroups,
      and(eq(mentorGroups.id, mentorGroupMentors.groupId), NOT_ENDED),
    )
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(
      and(
        inArray(mentorGroupMentors.mentorId, [...mentorIds]),
        isNull(mentorGroupMentors.endsOn),
      ),
    )
    .orderBy(
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.name),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
}

/** How many anak asuh `mentees` lets through. */
export async function countMentees(
  db: Database,
  mentees: SQL,
): Promise<number> {
  const [found] = await db
    .select({ students: count() })
    .from(students)
    .where(mentees);
  return found?.students ?? 0;
}
