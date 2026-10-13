import { and, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import type { GroupCodeParts } from "@/ui/group-code";

/** The kelompok pengasuhan of a student as the list names it. */
export interface ListedGroup extends GroupCodeParts {
  /** The mentor of today. Null for a group that has none. */
  mentorName: string | null;
}

/*
 * Named apart: the list joins the student's own program studi and the
 * account that put the student in under the plain names.
 */
export const groupProgram = alias(studyPrograms, "group_program");
export const groupMentor = alias(accounts, "group_mentor");

/** What a read of students joins to know each one's group in force. */
export const IS_MEMBER = eq(mentorGroupMembers.studentId, students.id);
export const GROUP_IN_FORCE = and(
  eq(mentorGroups.id, mentorGroupMembers.groupId),
  NOT_ENDED,
);
export const GROUP_PROGRAM = eq(groupProgram.id, mentorGroups.studyProgramId);
export const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroups.id),
  isNull(mentorGroupMentors.endsOn),
);
export const GROUP_MENTOR = eq(groupMentor.id, mentorGroupMentors.mentorId);

/** A student in no group in force, in a read that joins the groups. */
export const IN_NO_GROUP = isNull(mentorGroups.id);

export const GROUP_COLUMNS = {
  groupCohortYear: mentorGroups.cohortYear,
  groupEntryPath: mentorGroups.entryPath,
  groupNumber: mentorGroups.number,
  groupProgramCode: groupProgram.code,
  groupMentorName: groupMentor.name,
};

/** The group columns of one row. All are null for a student in no group. */
export interface GroupColumns {
  groupCohortYear: number | null;
  groupEntryPath: ListedGroup["entryPath"] | null;
  groupNumber: number | null;
  groupProgramCode: string | null;
  groupMentorName: string | null;
}

/** The group those columns tell of, or null for a student in none. */
export function listedGroupOf(row: GroupColumns): ListedGroup | null {
  if (
    row.groupCohortYear === null ||
    row.groupEntryPath === null ||
    row.groupNumber === null ||
    row.groupProgramCode === null
  ) {
    return null;
  }
  return {
    cohortYear: row.groupCohortYear,
    entryPath: row.groupEntryPath,
    number: row.groupNumber,
    programCode: row.groupProgramCode,
    mentorName: row.groupMentorName,
  };
}
