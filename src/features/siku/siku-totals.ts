import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sikuAdjustmentStudents, sikuAdjustments } from "@/db/schema";
import type { SikuTotals } from "./siku-score";

/** An entry that counts: one that was not cancelled. */
export const IN_FORCE = isNull(sikuAdjustments.cancelledAt);

function pointsOf(kind: "gain" | "loss") {
  return sql<number>`coalesce(sum(${sikuAdjustments.points}) filter (where ${sikuAdjustments.kind} = ${kind}), 0)`.mapWith(
    Number,
  );
}

/**
 * The points each student gained and lost by the entries in force, of
 * every period, as a table to join students to. A student with no entry
 * in force has no row.
 */
export function totalsByStudent(db: Database) {
  return db
    .select({
      studentId: sikuAdjustmentStudents.studentId,
      gains: pointsOf("gain").as("gains"),
      losses: pointsOf("loss").as("losses"),
      lastDay: sql<string>`max(${sikuAdjustments.day})`.as("last_day"),
    })
    .from(sikuAdjustmentStudents)
    .innerJoin(
      sikuAdjustments,
      and(
        eq(sikuAdjustments.id, sikuAdjustmentStudents.adjustmentId),
        IN_FORCE,
      ),
    )
    .groupBy(sikuAdjustmentStudents.studentId)
    .as("siku_totals");
}

/** The gains and losses of some students, none for one without an entry. */
export async function readTotalsOf(
  db: Database,
  studentIds: readonly string[],
): Promise<Map<string, SikuTotals>> {
  const totals = new Map<string, SikuTotals>();
  if (studentIds.length === 0) return totals;
  for (const id of studentIds) totals.set(id, { gains: 0, losses: 0 });
  const table = totalsByStudent(db);
  const rows = await db
    .select({
      studentId: table.studentId,
      gains: table.gains,
      losses: table.losses,
    })
    .from(table)
    .where(inArray(table.studentId, [...studentIds]));
  for (const { studentId, gains, losses } of rows) {
    totals.set(studentId, { gains, losses });
  }
  return totals;
}
