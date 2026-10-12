import { and, asc, desc, eq, type SQL } from "drizzle-orm";
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
import type { GroupCodeParts } from "@/ui/group-code";
import { inactiveSince, type MentorStatus } from "@/ui/mentor-status";
import { type GroupMember, MEMBER, opensDetailOf } from "./group-detail";
import { LISTED_MEMBER } from "./member-conditions";
import {
  type HeldGroup,
  readGroupsHeld,
  studentsIn,
} from "./mentor-held-groups";
import { shownStatus } from "./mentor-list";
import { groupsVisibleTo } from "./visible-groups";
import {
  heldTodayBy,
  mentorsVisibleTo,
  ROLE_TAKEN_AT,
} from "./visible-mentors";

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
export interface MentorDetail {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  status: MentorStatus;
  /** The day since when a Tidak aktif mentor is so, when it is known. */
  inactiveSince: string | null;
  /** The groups held today. */
  groups: HeldGroup[];
  /** How many Aktif students those groups hold. */
  students: number;
  /** Every time the mentor held a group, the newest first. */
  assignments: MentorAssignment[];
  /** By name: the Aktif members of the groups held today, and those on Cuti. */
  members: MentorStudent[];
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
      deletedAt: accounts.deletedAt,
      roleTakenAt: ROLE_TAKEN_AT,
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

function readStudents(
  db: Database,
  limit: RowLimit,
  mentorId: string,
  detailVisible: SQL | null,
): Promise<MentorStudent[]> {
  return db
    .select({
      ...MEMBER,
      opensDetail: opensDetailOf(detailVisible),
      group: GROUP_CODE,
    })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.groupId, mentorGroups.id),
    )
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .where(
      and(
        eq(mentorGroupMentors.mentorId, mentorId),
        heldTodayBy(limit),
        LISTED_MEMBER,
      ),
    )
    .orderBy(asc(students.name), asc(students.nim));
}

/**
 * One mentor with their groups, history and students, for an account with
 * this row limit. An id that names no mentor is not found. A mentor
 * outside the account's rows is refused, and nothing more is read of them.
 * `detailVisible` holds the students whose detail the account may open,
 * or null for none: an account may see a mentor and still not open the
 * detail of each of their students.
 */
export async function readMentor(
  db: Database,
  limit: RowLimit,
  id: string,
  detailVisible: SQL | null,
): Promise<MentorAnswer> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const account = await findMentor(db, limit, id);
  if (!account) return NOT_FOUND;
  const { isVisible, deletedAt, roleTakenAt, ...mentor } = account;
  if (!isVisible) return { kind: "refused" };
  const [groups, assignments, members] = await Promise.all([
    readGroupsHeld(db, limit, [id]),
    readAssignments(db, limit, id),
    readStudents(db, limit, id, detailVisible),
  ]);
  const isInactive = mentor.status === "inactive";
  return {
    kind: "found",
    mentor: {
      ...mentor,
      inactiveSince: isInactive
        ? inactiveSince({ roleTakenAt, deletedAt })
        : null,
      groups,
      students: studentsIn(groups),
      assignments,
      members,
    },
  };
}
