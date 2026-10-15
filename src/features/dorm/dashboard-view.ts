import type { SQL } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_IDS } from "@/dorms/dorms";
import type { ResidentsByDorm } from "./activity-audience";
import { readAnnouncedCounts, readCountMarks } from "./dashboard-attendance";
import { type LeaveNumbers, readLeaveNumbers } from "./dashboard-leave";
import {
  type CountedAttendance,
  daysShown,
  linesOf,
  overallAttendance,
} from "./dashboard-lines";
import { readActivityRows } from "./leave-store";
import { countResidentsByDorm } from "./resident-counts";

/** What Dashboard asrama shows. */
export interface DashboardView {
  /** The residents of each dorm today. */
  residents: ResidentsByDorm;
  leave: LeaveNumbers;
  /** Kehadiran 7 hari terakhir. */
  overall: CountedAttendance;
}

/** Who reads Dashboard asrama. */
export interface DashboardReader {
  /** The students whose numbers the account may see. */
  visible: SQL;
}

/**
 * Dashboard asrama at a moment, among the students the account may see.
 * Every number is counted from the records each time: nothing is kept
 * for it. A fixed number of reads, however many activities there are.
 */
export async function loadDashboard(
  db: Database,
  reader: DashboardReader,
  moment: Date,
): Promise<DashboardView> {
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const days = daysShown(now.day);
  const { visible } = reader;
  const [residents, dormCohorts, leave, rows, counts] = await Promise.all([
    countResidentsByDorm(db, visible, now.day),
    readDormCohorts(db, now.day),
    readLeaveNumbers(db, visible, moment),
    readActivityRows(db, [...DORM_IDS], days.first, days.last),
    readAnnouncedCounts(db, days),
  ]);
  const lines = linesOf(rows, counts, now);
  const { groups, changed } = await readCountMarks(
    db,
    lines,
    days,
    visible,
    dormCohorts ?? [],
  );
  return {
    residents,
    leave,
    overall: overallAttendance(lines, groups, changed),
  };
}
