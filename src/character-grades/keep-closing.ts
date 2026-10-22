import type { Database } from "@/db/connect";
import { fixedCharacterGrades, semesterClosings } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  type ClosingCounts,
  closingCounts,
  fixedGradeOf,
} from "./fixed-grades";
import type { GradeRow } from "./grade-list";
import type { GradeScheme } from "./scheme-ids";

/** The name of the database's rule that closes a period once at most. */
export const CLOSED_ONCE_RULE = "semester_closings_once_per_period";

/**
 * How many grades go to the database in one statement. PostgreSQL takes
 * at most 65,535 values in one, and each grade holds 15.
 */
const GRADES_PER_INSERT = 1000;

export interface Closing {
  periodId: string;
  closedBy: string;
  scheme: GradeScheme;
  rows: readonly GradeRow[];
}

function schemeColumns(scheme: GradeScheme) {
  return {
    attendanceWeight: scheme.weights.attendance,
    mentoringWeight: scheme.weights.mentoring,
    sikuWeight: scheme.weights.siku,
    skpmWeight: scheme.weights.skpm,
    aFrom: scheme.lowerLimits.A,
    bFrom: scheme.lowerLimits.B,
    cFrom: scheme.lowerLimits.C,
    dFrom: scheme.lowerLimits.D,
    passLetter: scheme.passLetter,
  };
}

/**
 * Keeps the closing of a period, which is also its line in the change log,
 * with every grade it fixes. Run inside the transaction of the closing, so
 * the whole of it is kept or none of it. The database refuses a second
 * closing of the same period by the rule named above.
 */
export async function keepClosing(
  tx: Database,
  closing: Closing,
): Promise<ClosingCounts> {
  const counts = closingCounts(closing.rows);
  const [kept] = await tx
    .insert(semesterClosings)
    .values({
      periodId: closing.periodId,
      closedBy: closing.closedBy,
      closedAt: WRITTEN_NOW,
      ...schemeColumns(closing.scheme),
      ...counts,
    })
    .returning({ id: semesterClosings.id });
  if (!kept) throw new Error("The closing was not kept.");
  const grades = closing.rows.map((row) => ({
    closingId: kept.id,
    ...fixedGradeOf(row),
  }));
  for (let start = 0; start < grades.length; start += GRADES_PER_INSERT) {
    const part = grades.slice(start, start + GRADES_PER_INSERT);
    await tx.insert(fixedCharacterGrades).values(part);
  }
  return counts;
}
