import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityClarifications } from "@/db/schema";
import type { ShownClarification } from "./clarification-time";

/**
 * The newest clarification of one student for each of some schedules.
 * The student is the one the account's own rows hold, never one asked
 * for from outside.
 */
export async function readOwnClarifications(
  db: Database,
  studentId: string,
  scheduleIds: readonly string[],
): Promise<Map<string, ShownClarification>> {
  const newest = new Map<string, ShownClarification>();
  if (scheduleIds.length === 0) return newest;
  const rows = await db
    .select({
      scheduleId: activityClarifications.scheduleId,
      status: activityClarifications.status,
      note: activityClarifications.note,
    })
    .from(activityClarifications)
    .where(
      and(
        eq(activityClarifications.studentId, studentId),
        inArray(activityClarifications.scheduleId, [...new Set(scheduleIds)]),
      ),
    )
    .orderBy(desc(activityClarifications.sentAt));
  for (const { scheduleId, ...clarification } of rows) {
    if (!newest.has(scheduleId)) newest.set(scheduleId, clarification);
  }
  return newest;
}
