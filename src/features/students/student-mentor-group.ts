import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";

/** The mentor of today of a student's group. */
export interface GroupMentor {
  name: string;
  title: string | null;
  /** The day this mentor took the group. */
  since: string;
}

/** The kelompok pengasuhan of one student, as their detail shows it. */
export interface StudentMentorGroup extends GroupCodeParts {
  id: string;
  /** Decides which accounts may open the group's page. */
  studyProgramId: number;
  /** Null for a group left without a mentor. */
  mentor: GroupMentor | null;
  /** The names of the mentors before, the oldest first. */
  earlierMentors: string[];
}

/**
 * What the Pengasuh line says of a group. The id and the program studi are
 * left out: they only serve the link to the group's page.
 */
export type ShownMentorGroup = Omit<
  StudentMentorGroup,
  "id" | "studyProgramId"
>;

/** A group with only what the Pengasuh line says of it. */
export function shownPartOf(group: StudentMentorGroup): ShownMentorGroup {
  return {
    cohortYear: group.cohortYear,
    entryPath: group.entryPath,
    number: group.number,
    programCode: group.programCode,
    mentor: group.mentor,
    earlierMentors: group.earlierMentors,
  };
}

/**
 * The address of the page of a student's group, or null for an account
 * that may not open it. The group is then named without a link.
 */
export type GroupAddressOf = (group: StudentMentorGroup) => string | null;

const LINE = {
  id: mentorGroups.id,
  studyProgramId: mentorGroups.studyProgramId,
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
  mentorName: accounts.name,
  mentorTitle: accounts.title,
  startsOn: mentorGroupMentors.startsOn,
  endsOn: mentorGroupMentors.endsOn,
};

/**
 * A student's group with one of its mentor lines, the oldest first. A
 * group that never had a mentor is one line with no mentor in it.
 */
export interface MentorGroupLine extends GroupCodeParts {
  id: string;
  studyProgramId: number;
  mentorName: string | null;
  mentorTitle: string | null;
  startsOn: string | null;
  endsOn: string | null;
}

function mentorOfToday(lines: MentorGroupLine[]): GroupMentor | null {
  for (const line of lines) {
    const holdsToday = line.endsOn === null;
    if (holdsToday && line.mentorName !== null && line.startsOn !== null) {
      return {
        name: line.mentorName,
        title: line.mentorTitle,
        since: line.startsOn,
      };
    }
  }
  return null;
}

function mentorsBefore(lines: MentorGroupLine[]): string[] {
  const names: string[] = [];
  for (const line of lines) {
    if (line.endsOn !== null && line.mentorName !== null) {
      names.push(line.mentorName);
    }
  }
  return names;
}

/** The group those lines tell of, or null for a student in no group. */
export function mentorGroupOf(
  lines: MentorGroupLine[],
): StudentMentorGroup | null {
  const [group] = lines;
  if (!group) return null;
  return {
    id: group.id,
    studyProgramId: group.studyProgramId,
    cohortYear: group.cohortYear,
    entryPath: group.entryPath,
    number: group.number,
    programCode: group.programCode,
    mentor: mentorOfToday(lines),
    earlierMentors: mentorsBefore(lines),
  };
}

/**
 * The group of one student, in one read. It does not ask who is reading:
 * call it only for a student the account was already shown.
 */
export async function readStudentMentorGroup(
  db: Database,
  studentId: string,
): Promise<StudentMentorGroup | null> {
  const lines = await db
    .select(LINE)
    .from(mentorGroupMembers)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(
      mentorGroupMentors,
      eq(mentorGroupMentors.groupId, mentorGroups.id),
    )
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(eq(mentorGroupMembers.studentId, studentId))
    .orderBy(asc(mentorGroupMentors.startsOn));
  return mentorGroupOf(lines);
}
