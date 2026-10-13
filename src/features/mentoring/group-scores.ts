import { and, asc, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, mentoringScores, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { opensDetailOf } from "@/mentoring/opens-detail";

/** A member as "Nilai anak asuh" lists them, with the score kept for them. */
export interface ScoredMember {
  id: string;
  name: string;
  nim: string;
  /** The score of the period, or null for a member without one. */
  score: number | null;
  /** When the score was saved last, or null for a member without one. */
  scoredAt: Date | null;
  /** Whether the account that reads the list may open the member's detail. */
  opensDetail: boolean;
}

/**
 * The members of a group "Nilai anak asuh" holds, by name: those who are
 * Aktif today, each with the score kept for them in the period. A member
 * on Cuti or Non aktif is not listed. `detailVisible` holds the students
 * whose detail the account may open, or null for none. The group is one
 * the account may read: the caller takes it from the groups of its limit.
 */
export function listScoredMembers(
  db: Database,
  groupId: string,
  periodId: string,
  detailVisible: SQL | null,
): Promise<ScoredMember[]> {
  const scoreOfPeriod = and(
    eq(mentoringScores.studentId, students.id),
    eq(mentoringScores.periodId, periodId),
  );
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      score: mentoringScores.score,
      scoredAt: mentoringScores.scoredAt,
      opensDetail: opensDetailOf(detailVisible),
    })
    .from(mentorGroupMembers)
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .leftJoin(mentoringScores, scoreOfPeriod)
    .where(and(eq(mentorGroupMembers.groupId, groupId), ACTIVE_MEMBER))
    .orderBy(asc(students.name), asc(students.nim));
}
