import { and, eq, sql } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { CoachingLevel } from "@/character-scores/coaching-need";
import type { CoachingStatus } from "@/character-scores/coaching-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { coachingStatuses, students } from "@/db/schema";
import type { ValueKey } from "@/ui/medali-values";
import { listedWithin, needOf, SHOWN_STATUS } from "./coaching-board";
import { coachingReachOf } from "./coaching-reach";

/** What the panel "Pembinaan (level)" of a student's detail shows. */
export interface StudentCoaching {
  level: CoachingLevel;
  /** "Aspek terlemah". */
  weakest: ValueKey;
  /** Teridentifikasi for a student with no saved status. */
  status: CoachingStatus;
  /** The note kept with the current status; empty when none was written. */
  note: string;
}

/**
 * One student's row of Pembinaan karakter, read the way the list reads
 * it, anew on each opening. Null, with nothing read, for an account whose
 * roles do not open that tab. Null too for a student outside the rows the
 * tab shows the account, the same answer as for a student who is not
 * listed, so a refusal tells nothing.
 */
export async function readStudentCoaching(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<StudentCoaching | null> {
  const reach = coachingReachOf(actor);
  if (reach === null) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const latest = latestAssessments(db);
  const [found] = await db
    .select({
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
      status: SHOWN_STATUS,
      note: sql<string>`coalesce(${coachingStatuses.note}, '')`,
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(and(eq(students.id, studentId), listedWithin(reach, latest)));
  if (!found) return null;
  const { status, note, ...scores } = found;
  const need = needOf(scores);
  return { level: need.level, weakest: need.weakest, status, note };
}
