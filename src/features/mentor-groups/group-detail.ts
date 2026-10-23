import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { latestAssessments } from "@/character-scores/latest-assessments";
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
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { opensDetailOf } from "@/mentoring/opens-detail";
import type { GroupCodeParts } from "@/ui/group-code";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import { LISTED_MEMBER } from "./member-conditions";
import {
  lowestRerataOrder,
  type MemberCounts,
  readMemberCounts,
} from "./member-page";
import { readScoreSums } from "./member-scores";
import { type ScoreSummary, scoreSummary } from "./score-averages";
import { maySeeGroup } from "./visible-groups";

/** One mentor line of a group. The NIP of the mentor is never read. */
export interface GroupMentorLine {
  id: string;
  /** The mentor's account, which the address of their page names. */
  mentorId: string;
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
  /** Whether the account that reads the group may open this member's detail. */
  opensDetail: boolean;
}

/** What the page of one group shows. */
export interface GroupDetail extends GroupCodeParts {
  id: string;
  /** Decides which accounts may open the page of its mentor. */
  studyProgramId: number;
  studyProgram: string;
  startsOn: string;
  /** The newest first. */
  mentors: GroupMentorLine[];
  /**
   * One page of the Aktif members and those on Cuti, the lowest Rerata
   * first and those not assessed last, then by name.
   */
  members: GroupMember[];
  /** The page given: the one asked for, or the last when it is past it. */
  memberPage: number;
  /** Of every member, not of the page. */
  memberCounts: MemberCounts;
  /** The medal of every Aktif member, not of the page. */
  summary: ScoreSummary | null;
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
  mentorId: mentorGroupMentors.mentorId,
  name: accounts.name,
  title: accounts.title,
  unit: accounts.unit,
  startsOn: mentorGroupMentors.startsOn,
  endsOn: mentorGroupMentors.endsOn,
  endReason: mentorGroupMentors.endReason,
};

export const MEMBER = {
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

/** The students the page of a group lists: its Aktif members and those on Cuti. */
function listedIn(db: Database, groupId: string): SQL {
  const members = db
    .select({ id: mentorGroupMembers.studentId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.groupId, groupId));
  return and(inArray(students.id, members), LISTED_MEMBER) ?? sql`false`;
}

function readMembers(
  db: Database,
  listed: SQL,
  detailVisible: SQL | null,
  page: number,
): Promise<GroupMember[]> {
  const latest = latestAssessments(db);
  return db
    .select({ ...MEMBER, opensDetail: opensDetailOf(detailVisible) })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(listed)
    .orderBy(...lowestRerataOrder(latest.total))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

/**
 * One group with its mentors and one page of its members, for an account
 * with this row limit. An ended group is not found, as one that never
 * was. A group outside the account's rows is refused, and nothing of it
 * is read beyond its program studi. `detailVisible` holds the students
 * whose detail the account may open, or null for none: an account may
 * read a group and still not open the detail of each of its members.
 */
export async function readGroup(
  db: Database,
  limit: RowLimit,
  id: string,
  detailVisible: SQL | null,
  memberPage = 1,
): Promise<GroupAnswer> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const [found] = await db
    .select(GROUP)
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(and(eq(mentorGroups.id, id), NOT_ENDED));
  if (!found) return NOT_FOUND;
  if (!maySeeGroup(limit, found.studyProgramId)) return { kind: "refused" };
  const listed = listedIn(db, id);
  const [mentors, memberCounts, sums] = await Promise.all([
    readMentorLines(db, id),
    readMemberCounts(db, listed),
    readScoreSums(db, listed),
  ]);
  const given = pageWithin(memberPage, memberCounts.listed);
  const members = await readMembers(db, listed, detailVisible, given);
  return {
    kind: "found",
    group: {
      ...found,
      mentors,
      members,
      memberPage: given,
      memberCounts,
      summary: scoreSummary(sums),
    },
  };
}
