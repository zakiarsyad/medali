import { and, asc, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormClarifications } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { cardOf, countCards, selectCardRows } from "./clarification-list";
import {
  type ClarificationTask,
  TASKS_SHOWN,
  type TaskSection,
} from "./tasks-card";

/** A clarification BAM passed on, which only Pengelola Asrama can decide now. */
export const PASSED_ON_BY_BAM = eq(dormClarifications.status, "verified");

/**
 * How many clarifications among the students `visible` holds wait for
 * the decision of Pengelola Asrama.
 */
export function countPassedOn(db: Database, visible: SQL): Promise<number> {
  return countCards(db, and(visible, PASSED_ON_BY_BAM));
}

/**
 * The clarifications BAM passed on among the students `visible` holds,
 * the earliest sent first, each as its card on Klarifikasi kehadiran
 * shows it, with how many wait in all. The file is named only when
 * `mayOpenFiles`.
 */
export async function readClarificationSection(
  db: Database,
  visible: SQL,
  dorm: SQL<DormId | null>,
  mayOpenFiles: boolean,
): Promise<TaskSection<ClarificationTask>> {
  const [rows, total] = await Promise.all([
    selectCardRows(db, dorm)
      .where(and(visible, PASSED_ON_BY_BAM))
      .orderBy(asc(dormClarifications.sentAt), asc(dormClarifications.id))
      .limit(TASKS_SHOWN),
    countPassedOn(db, visible),
  ]);
  return { items: rows.map((row) => cardOf(row, mayOpenFiles)), total };
}
