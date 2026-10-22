import { and, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { disciplinePenalties } from "@/db/schema";
import type { PenaltyKind } from "./penalty-kinds";
import { LIMITING_CATEGORIES, limitOf } from "./score-limit";

/**
 * The penalty that limits the scores of each of some students who has
 * one, in one read for all of them. Only the Kategori and the Jenjang
 * leave the database: never the Uraian, so a role that may not read
 * discipline records still sees the limit and nothing more.
 */
export async function readLimitsOf(
  db: Database,
  studentIds: readonly string[],
): Promise<Map<string, PenaltyKind>> {
  const found = new Map<string, PenaltyKind>();
  if (studentIds.length === 0) return found;
  const rows = await db
    .select({
      studentId: disciplinePenalties.studentId,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
    })
    .from(disciplinePenalties)
    .where(
      and(
        inArray(disciplinePenalties.studentId, [...studentIds]),
        inArray(disciplinePenalties.category, [...LIMITING_CATEGORIES]),
      ),
    );
  const byStudent = new Map<string, PenaltyKind[]>();
  for (const { studentId, ...kind } of rows) {
    const kinds = byStudent.get(studentId) ?? [];
    kinds.push(kind);
    byStudent.set(studentId, kinds);
  }
  for (const [studentId, kinds] of byStudent) {
    const limit = limitOf(kinds);
    if (limit !== null) found.set(studentId, limit);
  }
  return found;
}
