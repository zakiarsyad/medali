import { asc, eq } from "drizzle-orm";
import type { Scores } from "@/character-scores/assessment-score";
import type { CoachingStatus } from "@/character-scores/coaching-status";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  characterAssessments,
  coachingStatusChanges,
  coachingStatuses,
} from "@/db/schema";

/** Made-up assessments and coaching statuses for the checks of Pembinaan karakter. */

/** 55, 58, 60, 57, 59, 61: Rerata 58.3, Intensif. */
export const INTENSIVE: Scores = { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 };
/** 62, 60, 64, 58, 61, 63: Rerata 61.3, Sedang. */
export const MODERATE: Scores = { M: 62, E: 60, D: 64, A: 58, L: 61, I: 63 };
/** 70, 72, 56, 75, 74, 73: Rerata 70.0 with one value under 58, Ringan. */
export const LIGHT: Scores = { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 };
/** 66, 70, 58, 72, 68, 71: not listed. */
export const NOT_LISTED: Scores = { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 };

/** The odd period of a Tahun akademik of the file's own. Gives its key. */
export async function addCoachingPeriod(
  db: Database,
  year: number,
): Promise<string> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: year,
      term: "odd",
      startsOn: `${year}-08-01`,
      endsOn: `${year + 1}-01-31`,
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/** An assessment kept as it is, without the rules that check a sent form. */
export async function addCoachingAssessment(
  db: Database,
  studentId: string,
  byId: string,
  periodId: string,
  scores: Scores,
  enteredAt: Date,
): Promise<void> {
  await db.insert(characterAssessments).values({
    id: crypto.randomUUID(),
    studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: "mentor_observation",
    note: "",
    periodId,
    enteredBy: byId,
    enteredAt,
  });
}

/** A status kept straight in the table, at version 1, with no log line. */
export async function addCoachingStatus(
  db: Database,
  studentId: string,
  byId: string,
  status: CoachingStatus,
  note = "",
): Promise<void> {
  await db.insert(coachingStatuses).values({
    studentId,
    status,
    note,
    changedBy: byId,
    changedAt: new Date(),
  });
}

/** A student's status as it is kept, or undefined for none. */
export async function coachingStatusAt(db: Database, studentId: string) {
  const [kept] = await db
    .select()
    .from(coachingStatuses)
    .where(eq(coachingStatuses.studentId, studentId));
  return kept;
}

/** The log lines of a student's status, the earliest first. */
export function coachingLinesOf(db: Database, studentId: string) {
  return db
    .select()
    .from(coachingStatusChanges)
    .where(eq(coachingStatusChanges.studentId, studentId))
    .orderBy(asc(coachingStatusChanges.changedAt));
}
