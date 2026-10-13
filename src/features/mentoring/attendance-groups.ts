import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMentors,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import type { GroupCodeParts } from "@/ui/group-code";

const NO_GROUP = sql`false`;

/** The mentor who holds a group today. The NIP is never read. */
export interface GroupMentor {
  id: string;
  name: string;
  title: string | null;
}

/** A group whose meetings an account may read. */
export interface AttendanceGroup extends GroupCodeParts {
  id: string;
  /** Null for a group that has no mentor today. */
  mentor: GroupMentor | null;
}

/** The groups these mentors hold today. A line that has ended opens none. */
function heldTodayBy(mentorIds: string[]): SQL {
  return sql`exists (
    select 1 from ${mentorGroupMentors}
    where ${mentorGroupMentors.groupId} = ${mentorGroups.id}
      and ${mentorGroupMentors.endsOn} is null
      and ${inArray(mentorGroupMentors.mentorId, mentorIds)}
  )`;
}

/**
 * The groups whose meetings a row limit opens, for the `where` of a read
 * of groups: every group in force, or those of the study programs and
 * those the mentors hold today. A mentor who was replaced reads that
 * group no more. A limit to oneself opens none.
 */
export function attendanceGroupsVisibleTo(limit: RowLimit): SQL | undefined {
  if (limit.kind === "all") return NOT_ENDED;
  const own: SQL[] = [];
  if (limit.studyProgramIds.length > 0) {
    own.push(inArray(mentorGroups.studyProgramId, limit.studyProgramIds));
  }
  if (limit.menteesOf.length > 0) own.push(heldTodayBy(limit.menteesOf));
  if (own.length === 0) return NO_GROUP;
  return and(NOT_ENDED, or(...own));
}

/**
 * Whether an account with this limit to fill in may fill in for a group
 * with this mentor of today: only the one who holds the group does. Null
 * is the limit of an account without the right, and the mentor of a group
 * without one. A limit that opens every group names no mentor, so it
 * holds none.
 */
export function mayFillInFor(
  limit: RowLimit | null,
  mentorId: string | null,
): boolean {
  if (limit === null || mentorId === null) return false;
  if (limit.kind === "all") return false;
  return limit.menteesOf.includes(mentorId);
}

/**
 * The group the tab shows, among those the account may read: the one the
 * address asks for, or else the first. An address that names a group the
 * account may not read shows the first too, and nothing of the one it
 * named. Null for an account that reads no group.
 */
export function groupToShow<Group extends { id: string }>(
  readable: readonly Group[],
  askedId: string | null,
): Group | null {
  const asked = readable.find((group) => group.id === askedId);
  return asked ?? readable[0] ?? null;
}

const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroups.id),
  isNull(mentorGroupMentors.endsOn),
);

/**
 * The groups whose meetings an account with this limit may read, each
 * with its mentor of today: the newest angkatan first, as the list of
 * groups has them.
 */
export async function listAttendanceGroups(
  db: Database,
  limit: RowLimit,
): Promise<AttendanceGroup[]> {
  const rows = await db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      mentorId: accounts.id,
      mentorName: accounts.name,
      mentorTitle: accounts.title,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(attendanceGroupsVisibleTo(limit))
    .orderBy(
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.name),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
  return rows.map(({ mentorId, mentorName, mentorTitle, ...group }) => {
    if (mentorId === null || mentorName === null) {
      return { ...group, mentor: null };
    }
    const mentor = { id: mentorId, name: mentorName, title: mentorTitle };
    return { ...group, mentor };
  });
}
