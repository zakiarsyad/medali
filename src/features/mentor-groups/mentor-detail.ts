import { and, asc, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
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
import { opensDetailOf } from "@/mentoring/opens-detail";
import type { GroupCodeParts } from "@/ui/group-code";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { MentorStatus } from "@/ui/mentor-status";
import { type GroupMember, MEMBER } from "./group-detail";
import { type InactiveFacts, inactiveFacts } from "./inactive-facts";
import { LISTED_MEMBER } from "./member-conditions";
import { lowestRerataOrder, readMemberCounts } from "./member-page";
import { readScoreSums } from "./member-scores";
import {
  type HeldGroup,
  readGroupsHeld,
  studentsIn,
} from "./mentor-held-groups";
import { shownStatus } from "./mentor-list";
import { type ScoreSummary, scoreSummary } from "./score-averages";
import { groupsVisibleTo } from "./visible-groups";
import { heldTodayBy, MENTOR_END, mentorsVisibleTo } from "./visible-mentors";

/** One time a mentor held a group. */
export interface MentorAssignment extends GroupCodeParts {
  id: string;
  groupId: string;
  startsOn: string;
  /** Null for a group the mentor holds today. */
  endsOn: string | null;
  endReason: string | null;
}

/** A student a mentor looks after today, with the group they are in. */
export interface MentorStudent extends GroupMember {
  group: GroupCodeParts;
}

/** What the page of one mentor shows. The NIP is never read. */
export interface MentorDetail extends InactiveFacts {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  status: MentorStatus;
  /** The groups held today. */
  groups: HeldGroup[];
  /** How many Aktif students those groups hold. */
  students: number;
  /** Every time the mentor held a group, the newest first. */
  assignments: MentorAssignment[];
  /**
   * One page of the Aktif members of the groups held today and those on
   * Cuti, the lowest Rerata first and those not assessed last, then by name.
   */
  members: MentorStudent[];
  /** How many students those groups list in all, on every page. */
  listed: number;
  /** The page given: the one asked for, or the last when it is past it. */
  studentPage: number;
  /** The medal of every Aktif student of those groups, not of the page. */
  summary: ScoreSummary | null;
}

export type MentorAnswer =
  | { kind: "not_found" }
  | { kind: "refused" }
  | { kind: "found"; mentor: MentorDetail };

const NOT_FOUND = { kind: "not_found" } as const;

const EVERY_MENTOR: RowLimit = { kind: "all" };

const GROUP_CODE = {
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
};

const ASSIGNMENT = {
  id: mentorGroupMentors.id,
  groupId: mentorGroups.id,
  startsOn: mentorGroupMentors.startsOn,
  endsOn: mentorGroupMentors.endsOn,
  endReason: mentorGroupMentors.endReason,
  ...GROUP_CODE,
};

/** The account when it is a mentor at all, and whether the limit shows it. */
async function findMentor(db: Database, limit: RowLimit, id: string) {
  const [mentor] = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      title: accounts.title,
      unit: accounts.unit,
      status: shownStatus(limit),
      end: MENTOR_END,
      isVisible: mentorsVisibleTo(limit).mapWith(Boolean),
    })
    .from(accounts)
    .where(and(eq(accounts.id, id), mentorsVisibleTo(EVERY_MENTOR)));
  return mentor;
}

function readAssignments(
  db: Database,
  limit: RowLimit,
  mentorId: string,
): Promise<MentorAssignment[]> {
  return db
    .select(ASSIGNMENT)
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(
      and(eq(mentorGroupMentors.mentorId, mentorId), groupsVisibleTo(limit)),
    )
    .orderBy(
      desc(mentorGroupMentors.startsOn),
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.code),
      asc(mentorGroups.number),
    );
}

/**
 * The students the page of a mentor lists: the Aktif members and those on
 * Cuti of the groups the mentor holds today, among those the limit shows.
 */
function listedFor(db: Database, limit: RowLimit, mentorId: string): SQL {
  const held = db
    .select({ id: mentorGroupMembers.studentId })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.groupId, mentorGroups.id),
    )
    .where(and(eq(mentorGroupMentors.mentorId, mentorId), heldTodayBy(limit)));
  return and(inArray(students.id, held), LISTED_MEMBER) ?? sql`false`;
}

function readStudents(
  db: Database,
  listed: SQL,
  detailVisible: SQL | null,
  page: number,
): Promise<MentorStudent[]> {
  const latest = latestAssessments(db);
  return db
    .select({
      ...MEMBER,
      opensDetail: opensDetailOf(detailVisible),
      group: GROUP_CODE,
    })
    .from(students)
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.studentId, students.id),
    )
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(listed)
    .orderBy(...lowestRerataOrder(latest.total))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

/**
 * One mentor with their groups, history and one page of their students,
 * for an account with this row limit. An id that names no mentor is not
 * found. A mentor outside the account's rows is refused, and nothing more
 * is read of them. `detailVisible` holds the students whose detail the
 * account may open, or null for none: an account may see a mentor and
 * still not open the detail of each of their students.
 */
export async function readMentor(
  db: Database,
  limit: RowLimit,
  id: string,
  detailVisible: SQL | null,
  studentPage = 1,
): Promise<MentorAnswer> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const account = await findMentor(db, limit, id);
  if (!account) return NOT_FOUND;
  const { isVisible, end, ...mentor } = account;
  if (!isVisible) return { kind: "refused" };
  const listed = listedFor(db, limit, id);
  const [groups, assignments, counts, sums] = await Promise.all([
    readGroupsHeld(db, limit, [id]),
    readAssignments(db, limit, id),
    readMemberCounts(db, listed),
    readScoreSums(db, listed),
  ]);
  const given = pageWithin(studentPage, counts.listed);
  const members = await readStudents(db, listed, detailVisible, given);
  return {
    kind: "found",
    mentor: {
      ...mentor,
      ...inactiveFacts(mentor.status, end),
      groups,
      students: studentsIn(groups),
      assignments,
      members,
      listed: counts.listed,
      studentPage: given,
      summary: scoreSummary(sums),
    },
  };
}
