import type { SQL } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { ResidentsByDorm } from "./activity-audience";
import type { Organiser } from "./activity-ids";
import { readAnnouncedCounts, readCountMarks } from "./dashboard-attendance";
import {
  type LeaveByKind,
  type LeaveNumbers,
  type OutList,
  readLeaveNumbers,
  readMonthLeave,
  readOutList,
} from "./dashboard-leave";
import {
  type ActivityLine,
  attendanceByDorm,
  attendanceByOrganiser,
  type CountedAttendance,
  daysShown,
  linesOf,
  overallAttendance,
  type ShownLine,
  shownLineOf,
} from "./dashboard-lines";
import type { Attendance, Changed, MarkGroup } from "./dashboard-tally";
import { readActivityRows } from "./leave-store";
import { countResidentsByDorm } from "./resident-counts";

/** One page of Kehadiran kegiatan, and how many lines it has in all. */
export interface LinePage {
  lines: ShownLine[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

/** What Dashboard asrama shows. */
export interface DashboardView {
  /** Today on campus. */
  today: string;
  /** The residents of each dorm today. */
  residents: ResidentsByDorm;
  leave: LeaveNumbers;
  /** Kehadiran 7 hari terakhir. */
  overall: CountedAttendance;
  activities: LinePage;
  /** Kehadiran per penanggung jawab. */
  byOrganiser: Record<Organiser, CountedAttendance>;
  /** Kehadiran per asrama. */
  byDorm: Record<DormId, Attendance>;
  /** Perizinan bulan ini. */
  monthLeave: LeaveByKind;
  /** Who is out of the dorm, for an account that may see their names; null otherwise. */
  out: OutList | null;
}

/** Who reads Dashboard asrama. */
export interface DashboardReader {
  /** The students whose numbers the account may see. */
  visible: SQL;
  /**
   * The students whose names, Tujuan and rooms the account may see among
   * those out of the dorm, or null for an account without the right: then
   * none of them is read.
   */
  namesVisible: SQL | null;
}

function pageOfLines(
  lines: ActivityLine[],
  page: number,
  counted: { groups: MarkGroup[]; changed: Changed[] },
  residents: ResidentsByDorm,
): LinePage {
  const shownPage = pageWithin(page, lines.length);
  const start = (shownPage - 1) * PAGE_SIZE;
  const { groups, changed } = counted;
  return {
    lines: lines
      .slice(start, start + PAGE_SIZE)
      .map((line) => shownLineOf(line, groups, changed, residents)),
    matching: lines.length,
    page: shownPage,
  };
}

/**
 * Dashboard asrama at a moment, among the students the account may see,
 * with one page of Kehadiran kegiatan. Every number is counted from the
 * records each time: nothing is kept for it. A fixed number of reads,
 * however many activities there are.
 */
export async function loadDashboard(
  db: Database,
  reader: DashboardReader,
  moment: Date,
  page = 1,
): Promise<DashboardView> {
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const days = daysShown(now.day);
  const { visible, namesVisible } = reader;
  const [residents, dormCohorts, leave, monthLeave, rows, counts] =
    await Promise.all([
      countResidentsByDorm(db, visible, now.day),
      readDormCohorts(db, now.day),
      readLeaveNumbers(db, visible, moment),
      readMonthLeave(db, visible, moment),
      readActivityRows(db, [...DORM_IDS], days.first, days.last),
      readAnnouncedCounts(db, days),
    ]);
  const lines = linesOf(rows, counts, now);
  const [counted, out] = await Promise.all([
    readCountMarks(db, lines, days, visible, dormCohorts ?? []),
    namesVisible === null
      ? null
      : readOutList(db, namesVisible, moment, dormCohorts ?? []),
  ]);
  const { groups, changed } = counted;
  return {
    today: now.day,
    residents,
    leave,
    overall: overallAttendance(lines, groups, changed),
    activities: pageOfLines(lines, page, counted, residents),
    byOrganiser: attendanceByOrganiser(lines, groups, changed),
    byDorm: attendanceByDorm(lines, groups, changed),
    monthLeave,
    out,
  };
}
