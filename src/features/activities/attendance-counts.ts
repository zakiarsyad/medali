import { and, count, eq, or, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activitySchedules, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { AttendanceStatus } from "./attendance-status";
import { meantStudents } from "./meant-students";
import { newestAt } from "./newest-attendances";
import type { CohortCount } from "./participants";
import {
  type AttendanceCount,
  type AttendanceCounts,
  hasStarted,
} from "./schedule-attendance";
import type { ScheduleRow } from "./schedule-row";

type Counted = Pick<ScheduleRow, "id" | "startsOn" | "target" | "period">;

const NOBODY: AttendanceCount = {
  targeted: 0,
  present: 0,
  waiting: 0,
  dispensations: 0,
};

/** The students one schedule is meant for, for the join of a read of many. */
function meantBy(
  schedule: Counted,
  cohorts: readonly CohortCount[],
): SQL | undefined {
  const meant = meantStudents(schedule, cohorts);
  if (meant === undefined) return undefined;
  return and(eq(activitySchedules.id, schedule.id), meant);
}

/**
 * How the Aktif students stand at each schedule of one page of the list
 * that has started by `today`, counted in the database: only numbers
 * leave it, and nobody is named. `visible` limits the students to those
 * the account sees, so Ketua Program Studi and Pengasuh get the numbers
 * of their own students only. A schedule that has not started gets no
 * numbers.
 */
export async function readAttendanceCounts(
  db: Database,
  visible: SQL,
  schedules: readonly Counted[],
  cohorts: readonly CohortCount[],
  today: string,
): Promise<AttendanceCounts> {
  const started = schedules.filter((schedule) => hasStarted(schedule, today));
  const counts: Record<string, AttendanceCount> = {};
  for (const schedule of started) counts[schedule.id] = NOBODY;
  const meant = or(...started.map((schedule) => meantBy(schedule, cohorts)));
  if (meant === undefined) return counts;

  const newest = newestAt(
    db,
    started.map((schedule) => schedule.id),
  );
  function countOf(status: AttendanceStatus): SQL<number> {
    return sql<number>`count(*) filter (where ${newest.status} = ${status})::int`;
  }
  const rows = await db
    .select({
      scheduleId: activitySchedules.id,
      targeted: count(),
      present: countOf("valid"),
      waiting: countOf("waiting"),
      dispensations: countOf("dispensation"),
    })
    .from(activitySchedules)
    .innerJoin(students, meant)
    .leftJoin(
      newest,
      and(
        eq(newest.scheduleId, activitySchedules.id),
        eq(newest.studentId, students.id),
      ),
    )
    .where(and(ACTIVE_MEMBER, visible))
    .groupBy(activitySchedules.id);
  for (const { scheduleId, ...counted } of rows) counts[scheduleId] = counted;
  return counts;
}
