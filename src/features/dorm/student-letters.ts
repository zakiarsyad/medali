import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormWarningLetters } from "@/db/schema";
import type { WarningLevel } from "./warning-ids";

/** An SP issued to a student, as staff see it. */
export interface ShownLetter {
  level: WarningLevel;
  issuedAt: Date;
  /** Hasil klarifikasi, or null for an account that may not read it. */
  result: string | null;
  /** The note of the proposal of SP 2, or null for an account that may not read it. */
  proposalNote: string | null;
}

/**
 * The SPs issued to a student in a semester, SP 1 first. Hasil
 * klarifikasi and the proposal note are given only `withResults`, for
 * Pengelola Asrama and Kepala Unit, so they never reach another
 * account. Whether the account sees the student is checked by the
 * caller.
 */
export async function readStudentLetters(
  db: Database,
  periodId: string,
  studentId: string,
  withResults: boolean,
): Promise<ShownLetter[]> {
  const rows = await db
    .select({
      level: dormWarningLetters.level,
      issuedAt: dormWarningLetters.issuedAt,
      result: dormWarningLetters.result,
      proposalNote: dormWarningLetters.proposalNote,
    })
    .from(dormWarningLetters)
    .where(
      and(
        eq(dormWarningLetters.periodId, periodId),
        eq(dormWarningLetters.studentId, studentId),
        isNotNull(dormWarningLetters.issuedAt),
      ),
    )
    .orderBy(asc(dormWarningLetters.level));
  const letters: ShownLetter[] = [];
  for (const row of rows) {
    if (row.issuedAt === null) continue;
    letters.push({
      level: row.level === 2 ? 2 : 1,
      issuedAt: row.issuedAt,
      result: withResults ? row.result : null,
      proposalNote: withResults ? row.proposalNote : null,
    });
  }
  return letters;
}
