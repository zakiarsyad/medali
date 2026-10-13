import { inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityAttendances } from "@/db/schema";
import { NEWEST_FIRST } from "./student-schedules";

/**
 * The newest attendance of each student at each of some schedules, as a
 * table to join: one row for a student and a schedule, and none where
 * nothing was sent or recorded. `scheduleIds` must not be empty.
 */
export function newestAt(db: Database, scheduleIds: readonly string[]) {
  const { scheduleId, studentId, status } = activityAttendances;
  return db
    .selectDistinctOn([scheduleId, studentId], {
      scheduleId,
      studentId,
      status,
    })
    .from(activityAttendances)
    .where(inArray(scheduleId, [...scheduleIds]))
    .orderBy(scheduleId, studentId, NEWEST_FIRST)
    .as("newest");
}
