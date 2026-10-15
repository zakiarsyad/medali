import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  type dormClarifications,
  dormWarningLetterChanges,
  dormWarningLetters,
} from "@/db/schema";
import { addTestActivity } from "./test-activities";
import { addTestClarification, addTestCount } from "./test-clarifications";
import { addTestViolation } from "./test-violations";

/** Made-up calls, warning letters and what leads to them, for the checks of this area. */

/** The key of the odd period of a year a check added. */
export async function periodIdOf(db: Database, year: number): Promise<string> {
  const [found] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(eq(academicPeriods.startYear, year));
  if (!found) throw new Error("The period was not added.");
  return found.id;
}

/**
 * Violations of a resident, one a day from `firstDay` on, each announced
 * at 21:00 that day. Gives back their keys.
 */
export async function addTestViolations(
  db: Database,
  studentId: string,
  byId: string,
  amount: number,
  firstDay: string,
): Promise<string[]> {
  const ids: string[] = [];
  const start = new Date(`${firstDay}T00:00:00Z`).getTime();
  for (let place = 0; place < amount; place++) {
    const day = new Date(start + place * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    ids.push(await addTestViolation(db, studentId, byId, day));
  }
  return ids;
}

/**
 * An activity on a day at which the resident was absent, and their
 * clarification of it, rejected by BAM unless told otherwise. Gives back
 * the keys of the count and of the clarification.
 */
export async function addTestRejection(
  db: Database,
  studentId: string,
  byId: string,
  day: string,
  more: Partial<typeof dormClarifications.$inferInsert> = {},
): Promise<{ countId: string; clarificationId: string }> {
  const activityId = await addTestActivity(db, byId);
  const countId = await addTestCount(db, {
    activityId,
    day,
    byId,
    marks: { [studentId]: { isAbsent: true, note: "" } },
  });
  const clarificationId = await addTestClarification(db, byId, {
    countId,
    studentId,
    status: "rejected",
    ...more,
  });
  return { countId, clarificationId };
}

/** A call, issued as SP when `more` says so. Gives back its key. */
export async function addTestLetter(
  db: Database,
  letter: Pick<
    typeof dormWarningLetters.$inferInsert,
    "studentId" | "periodId" | "level"
  > &
    Partial<typeof dormWarningLetters.$inferInsert>,
): Promise<string> {
  const [added] = await db
    .insert(dormWarningLetters)
    .values(letter)
    .returning({ id: dormWarningLetters.id });
  if (!added) throw new Error("The letter was not added.");
  return added.id;
}

/** What an issued SP holds besides its level, by `byId`. */
export function issuedBy(byId: string, at = new Date("2026-10-13T09:30:00Z")) {
  return {
    result: "Mahasiswa hadir dan mengakui pelanggarannya.",
    issuedBy: byId,
    issuedAt: at,
  };
}

/** The letters of a student as kept, SP 1 first. */
export function lettersOf(db: Database, studentId: string) {
  return db
    .select()
    .from(dormWarningLetters)
    .where(eq(dormWarningLetters.studentId, studentId))
    .orderBy(asc(dormWarningLetters.level));
}

/** The log lines of a letter, the earliest first. */
export function letterLinesOf(db: Database, letterId: string) {
  return db
    .select()
    .from(dormWarningLetterChanges)
    .where(eq(dormWarningLetterChanges.letterId, letterId))
    .orderBy(asc(dormWarningLetterChanges.changedAt));
}
