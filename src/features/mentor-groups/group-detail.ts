import { and, asc, desc, eq } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "./group-code";
import { LISTED_MEMBER } from "./member-conditions";
import { maySeeGroup } from "./visible-groups";

/** One mentor line of a group. The NIP of the mentor is never read. */
export interface GroupMentorLine {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  startsOn: string;
  /** Null for the mentor of today. */
  endsOn: string | null;
  endReason: string | null;
}

export interface GroupMember {
  /** The id of the student's record, which the address of the detail names. */
  id: string;
  nim: string;
  name: string;
  className: string | null;
  cohortYear: number;
  status: (typeof students.$inferSelect)["status"];
}

/** What the page of one group shows. */
export interface GroupDetail extends GroupCodeParts {
  id: string;
  studyProgram: string;
  startsOn: string;
  /** The newest first. */
  mentors: GroupMentorLine[];
  /** By name: the Aktif members and those on Cuti. */
  members: GroupMember[];
}

export type GroupAnswer =
  | { kind: "not_found" }
  | { kind: "refused" }
  | { kind: "found"; group: GroupDetail };

const NOT_FOUND = { kind: "not_found" } as const;

const GROUP = {
  id: mentorGroups.id,
  studyProgramId: mentorGroups.studyProgramId,
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
  studyProgram: studyPrograms.name,
  startsOn: mentorGroups.startsOn,
};

const MENTOR_LINE = {
  id: mentorGroupMentors.id,
  name: accounts.name,
  title: accounts.title,
  unit: accounts.unit,
  startsOn: mentorGroupMentors.startsOn,
  endsOn: mentorGroupMentors.endsOn,
  endReason: mentorGroupMentors.endReason,
};

const MEMBER = {
  id: students.id,
  nim: students.nim,
  name: students.name,
  className: students.className,
  cohortYear: students.cohortYear,
  status: students.status,
};

function readMentorLines(
  db: Database,
  groupId: string,
): Promise<GroupMentorLine[]> {
  return db
    .select(MENTOR_LINE)
    .from(mentorGroupMentors)
    .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(eq(mentorGroupMentors.groupId, groupId))
    .orderBy(desc(mentorGroupMentors.startsOn));
}

function readMembers(db: Database, groupId: string): Promise<GroupMember[]> {
  return db
    .select(MEMBER)
    .from(mentorGroupMembers)
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .where(and(eq(mentorGroupMembers.groupId, groupId), LISTED_MEMBER))
    .orderBy(asc(students.name), asc(students.nim));
}

/**
 * One group with its mentors and members, for an account with this row
 * limit. A group outside the account's rows is refused, and nothing of it
 * is read beyond its program studi.
 */
export async function readGroup(
  db: Database,
  limit: RowLimit,
  id: string,
): Promise<GroupAnswer> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const [found] = await db
    .select(GROUP)
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(eq(mentorGroups.id, id));
  if (!found) return NOT_FOUND;
  const { studyProgramId, ...group } = found;
  if (!maySeeGroup(limit, studyProgramId)) return { kind: "refused" };
  const [mentors, members] = await Promise.all([
    readMentorLines(db, id),
    readMembers(db, id),
  ]);
  return { kind: "found", group: { ...group, mentors, members } };
}
