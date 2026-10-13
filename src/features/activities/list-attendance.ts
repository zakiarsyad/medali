import type { SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { readAbsent } from "./absent-students";
import { readAttendanceCounts } from "./attendance-counts";
import type { CohortCount } from "./participants";
import { hasStarted, type ListAttendance } from "./schedule-attendance";
import type { OpenAbsent } from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";

/**
 * The attendance of one page of the list of schedules on a day on
 * campus: the numbers of each schedule that has started, and the
 * students of "Peserta" only when the address asks for them. `open`
 * comes from the address and is not trusted: it opens only a schedule
 * of the page shown that has started. `visible` limits every student
 * read here to those the account sees.
 */
export async function readListAttendance(
  db: Database,
  visible: SQL,
  schedules: readonly ScheduleRow[],
  cohorts: readonly CohortCount[],
  open: OpenAbsent | null,
  today: string,
): Promise<ListAttendance> {
  const opened = schedules.find(
    (schedule) =>
      schedule.id === open?.scheduleId && hasStarted(schedule, today),
  );
  const [counts, absent] = await Promise.all([
    readAttendanceCounts(db, visible, schedules, cohorts, today),
    opened === undefined
      ? null
      : readAbsent(db, visible, opened, cohorts, open?.page ?? 1),
  ]);
  return { counts, absent };
}
