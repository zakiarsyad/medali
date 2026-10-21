import { count, desc, eq } from "drizzle-orm";
import { readStoredLatestOf } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { disciplinePenalties } from "@/db/schema";
import type { PenaltyHistory } from "./penalty-consequences";

/**
 * How many discipline penalties a student has had, and the highest of
 * them, the latest when two are as high, with the scores of their latest
 * assessment as stored. Read for the student's box of "Catat
 * pelanggaran" and for what a cap would do to the scores; who may read
 * it is decided by the caller.
 */
export async function readHistoryOf(
  db: Database,
  studentId: string,
): Promise<PenaltyHistory> {
  const ofStudent = eq(disciplinePenalties.studentId, studentId);
  const [counted] = await db
    .select({ count: count() })
    .from(disciplinePenalties)
    .where(ofStudent);
  const [top] = await db
    .select({
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      day: disciplinePenalties.day,
    })
    .from(disciplinePenalties)
    .where(ofStudent)
    .orderBy(
      desc(disciplinePenalties.category),
      desc(disciplinePenalties.level),
      desc(disciplinePenalties.day),
    )
    .limit(1);
  const latest = await readStoredLatestOf(db, studentId);
  return { count: counted?.count ?? 0, top: top ?? null, latest };
}
