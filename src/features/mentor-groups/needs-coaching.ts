import { and, count, eq } from "drizzle-orm";
import { listedForCoaching } from "@/character-scores/coaching-listed";
import { NOT_DONE } from "@/character-scores/coaching-shown-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { coachingStatuses, mentorGroupMembers, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";

/** "Perlu pembinaan": how many Aktif members, and their share of them all. */
export interface NeedsCoaching {
  students: number;
  /** A whole percent of the Aktif members. */
  percent: number;
}

/**
 * How many Aktif members of a group are on Pembinaan karakter and not yet
 * Selesai, by the one rule that list uses. A member on Cuti is left out,
 * as from the Aktif members it is counted against.
 */
export async function countNeedsCoaching(
  db: Database,
  groupId: string,
): Promise<number> {
  const latest = latestAssessments(db);
  const [counted] = await db
    .select({ students: count() })
    .from(students)
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.studentId, students.id),
    )
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(
      and(
        eq(mentorGroupMembers.groupId, groupId),
        ACTIVE_MEMBER,
        listedForCoaching(latest),
        NOT_DONE,
      ),
    );
  return counted?.students ?? 0;
}

/** The share of `active` members that `needing` is, or 0 for no member. */
export function needsCoachingPercent(needing: number, active: number): number {
  if (active === 0) return 0;
  return Math.round((needing / active) * 100);
}
