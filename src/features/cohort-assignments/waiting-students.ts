import { and, asc, eq, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import type { NewStudent } from "./form-groups";
import { inProgramsOf } from "./visible-assignments";

/** A student who is in a kelompok pengasuhan that is in force. */
export const IN_LIVE_GROUP = sql`exists (
  select 1 from ${mentorGroupMembers}
  inner join ${mentorGroups}
    on ${mentorGroups.id} = ${mentorGroupMembers.groupId}
  where ${mentorGroupMembers.studentId} = ${students.id}
    and ${mentorGroups.endedAt} is null
)`;

/**
 * A student a penetapan is about: Aktif, not removed, and in no group
 * that is in force. A student on Cuti or Non aktif is not placed, and one
 * who has a group already stays in it.
 */
export const WAITS_FOR_GROUP = sql`(
  ${students.status} = 'active'
  and ${students.deletedAt} is null
  and not ${IN_LIVE_GROUP}
)`;

/** A student who waits for a group, as the tab shows and places them. */
export interface WaitingStudent extends NewStudent {
  name: string;
  /** The name of the student's program studi. */
  programName: string;
}

const WAITING_STUDENT = {
  id: students.id,
  nim: students.nim,
  name: students.name,
  sex: students.sex,
  province: students.province,
  className: students.className,
  studyProgramId: students.studyProgramId,
  entryPath: students.entryPath,
  programName: studyPrograms.name,
};

/**
 * The students of an angkatan who wait for a group, among those an
 * account with this limit may see, by NIM.
 */
export function readWaitingStudents(
  db: Database,
  limit: RowLimit,
  cohortYear: number,
): Promise<WaitingStudent[]> {
  return db
    .select(WAITING_STUDENT)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(
      and(
        eq(students.cohortYear, cohortYear),
        WAITS_FOR_GROUP,
        inProgramsOf(limit, students.studyProgramId),
      ),
    )
    .orderBy(asc(students.nim));
}
