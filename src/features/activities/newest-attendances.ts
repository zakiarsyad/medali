import { and, eq, gt, inArray, type SQL, sql } from "drizzle-orm";
import { alias, QueryBuilder } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import { activityAttendances } from "@/db/schema";
import { cameInAt, NEWEST_FIRST } from "./student-schedules";

/**
 * The newest attendance of each student at each of some schedules, as a
 * table to join: one row for a student and a schedule, and none where
 * nothing was sent or recorded. With no schedules it holds no row.
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

// Named apart, so the attendance of the outer query is never mistaken for it.
const laterAttendance = alias(activityAttendances, "later_attendance");

/** The attendances of the same student and schedule that came in later. */
const CAME_IN_LATER = new QueryBuilder()
  .select({ found: sql`1` })
  .from(laterAttendance)
  .where(
    and(
      eq(laterAttendance.scheduleId, activityAttendances.scheduleId),
      eq(laterAttendance.studentId, activityAttendances.studentId),
      gt(cameInAt(laterAttendance), cameInAt(activityAttendances)),
    ),
  );

/**
 * The attendances that are their student's newest at their schedule: no
 * photo was sent and no record was made after them by the same order the
 * student's own page takes the newest by.
 */
export const IS_NEWEST: SQL = sql`not exists (${CAME_IN_LATER})`;
