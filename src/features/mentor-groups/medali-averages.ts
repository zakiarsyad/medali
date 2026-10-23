import { and, count, eq, inArray } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { averageRerata, type SameTotal } from "./score-averages";
import { groupsVisibleTo } from "./visible-groups";
import { heldTodayBy } from "./visible-mentors";

/** The average of each group or mentor that has an assessed member, by id. */
export type Reratas = Map<string, number>;

interface TotalOf extends SameTotal {
  id: string;
}

function reratasOf(rows: readonly TotalOf[]): Reratas {
  const totals = new Map<string, SameTotal[]>();
  for (const { id, ...same } of rows) {
    const found = totals.get(id) ?? [];
    found.push(same);
    totals.set(id, found);
  }
  const reratas: Reratas = new Map();
  for (const [id, same] of totals) {
    const rerata = averageRerata(same);
    if (rerata !== null) reratas.set(id, rerata);
  }
  return reratas;
}

/**
 * "Rerata MEDALI" of each of these groups an account with this limit may
 * see, in one read for all of them. Only the sums of the latest scores of
 * the Aktif members leave the database. A group where nobody is assessed
 * is not in the answer. Given a day, it is the Rerata of the scores as
 * they stood at the end of that day.
 */
export async function readGroupReratas(
  db: Database,
  limit: RowLimit,
  groupIds: string[],
  asOf?: string,
): Promise<Reratas> {
  if (groupIds.length === 0) return new Map();
  const latest = latestAssessments(db, asOf);
  const rows = await db
    .select({
      id: mentorGroupMembers.groupId,
      total: latest.total,
      students: count(),
    })
    .from(mentorGroupMembers)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(
      and(
        inArray(mentorGroupMembers.groupId, groupIds),
        groupsVisibleTo(limit),
        ACTIVE_MEMBER,
      ),
    )
    .groupBy(mentorGroupMembers.groupId, latest.total);
  return reratasOf(rows);
}

/**
 * "Rerata" of each of these mentors, in one read for all of them: over
 * the Aktif members of the groups each holds today, among those an
 * account with this limit may see. A mentor with no assessed mentee is
 * not in the answer.
 */
export async function readMentorReratas(
  db: Database,
  limit: RowLimit,
  mentorIds: string[],
): Promise<Reratas> {
  if (mentorIds.length === 0) return new Map();
  const latest = latestAssessments(db);
  const rows = await db
    .select({
      id: mentorGroupMentors.mentorId,
      total: latest.total,
      students: count(),
    })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.groupId, mentorGroups.id),
    )
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(
      and(
        inArray(mentorGroupMentors.mentorId, mentorIds),
        heldTodayBy(limit),
        ACTIVE_MEMBER,
      ),
    )
    .groupBy(mentorGroupMentors.mentorId, latest.total);
  return reratasOf(rows);
}
