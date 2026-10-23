import { and, eq, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { CoachingLevel } from "@/character-scores/coaching-need";
import {
  NOT_DONE,
  SHOWN_STATUS,
} from "@/character-scores/coaching-shown-status";
import type { CoachingStatus } from "@/character-scores/coaching-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { coachingStatuses, students } from "@/db/schema";
import type { ValueKey } from "@/ui/medali-values";
import { listedWithin, needOf } from "./coaching-board";
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
  return readCoachingWithin(db, reach, eq(students.id, studentId));
}

/**
 * "Pembinaan (level)" of the student of the account, for Profil saya,
 * read anew on each opening. Null for a student who is not listed or
 * whose pembinaan is Selesai, and, with nothing read, for an account
 * without the right. Which student is never asked from outside: it is the
 * one the account's own rows hold.
 */
export async function readOwnCoaching(
  db: Database,
  account: AccountForAccess,
): Promise<StudentCoaching | null> {
  const right = "view_own_coaching";
  if (!may(account.roles, right)) return null;
  const own = visibleTo(rowLimitForAction(account, right));
  return readCoachingWithin(db, own, NOT_DONE);
}

/** The one listed student within `reach` that `more` holds, or null. */
async function readCoachingWithin(
  db: Database,
  reach: SQL,
  more: SQL,
): Promise<StudentCoaching | null> {
  const latest = latestAssessments(db);
  const rows = await db
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
    .where(and(more, listedWithin(reach, latest)))
    .limit(2);
  const [found] = rows;
  // Rows that hold more than one student are refused and not shown.
  if (!found || rows.length > 1) return null;
  const { status, note, ...scores } = found;
  const need = needOf(scores);
  return { level: need.level, weakest: need.weakest, status, note };
}
