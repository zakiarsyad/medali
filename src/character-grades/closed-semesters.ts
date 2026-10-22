import type { Database } from "@/db/connect";
import { semesterClosings } from "@/db/schema";

/** When a semester was closed, and how many grades its closing fixed. */
export interface ClosedSemester {
  closedAt: Date;
  kept: number;
}

/** Every closed semester, by the key of its period. */
export async function readClosedSemesters(
  db: Database,
): Promise<Map<string, ClosedSemester>> {
  const rows = await db
    .select({
      periodId: semesterClosings.periodId,
      closedAt: semesterClosings.closedAt,
      kept: semesterClosings.students,
    })
    .from(semesterClosings);
  return new Map(rows.map(({ periodId, ...closed }) => [periodId, closed]));
}
