import type { SQL } from "drizzle-orm";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import type { Database } from "@/db/connect";
import type { ActivitiesParams } from "./activities-address";
import type { ResidentsByDorm } from "./activity-audience";
import { listOneOffs, listRoutines, type OneOffPage } from "./activity-lists";
import type { ActivityRow } from "./activity-row";
import type { DayAttendance } from "./announced-attendance";
import { loadCountPanel } from "./count-panel-view";
import type { CountPanelView } from "./count-view";
import { readDailyActivities } from "./daily-activities";
import { readDayAttendance } from "./day-attendance";
import { countResidentsByDorm } from "./resident-counts";

/** What the list that is open shows. Only that list is read. */
export type ActivitiesView =
  | {
      view: "harian";
      day: string;
      activities: ActivityRow[];
      /** The residents of each dorm the account may see, for Peserta. */
      residents: ResidentsByDorm;
      /**
       * "Penghitungan kehadiran", for an account that may count, on a day
       * with activities; null otherwise.
       */
      count: CountPanelView | null;
      /**
       * The announced counts of the day, for an account that may see the
       * attendance; null otherwise.
       */
      attendance: DayAttendance | null;
    }
  | { view: "rutin"; routines: ActivityRow[] }
  | { view: "nonrutin"; list: OneOffPage };

/** Who reads the screen, and when. */
export interface Reader {
  /** The students the account may see; the Peserta are counted among them. */
  visible: SQL;
  /** Whether the account may count the attendance. */
  mayCount: boolean;
  /**
   * The students whose attendance the account may see, or null for an
   * account that may not see the attendance.
   */
  attendanceVisible: SQL | null;
  /** The moment on campus the screen is read at. */
  now: CampusMoment;
}

/**
 * Reads the list the address asks for: one day of Jadwal harian, every
 * repeating activity, or one page of the one-off ones. Jadwal harian of
 * an account that may count holds "Penghitungan kehadiran" too.
 */
export async function loadActivitiesView(
  db: Database,
  params: ActivitiesParams,
  reader: Reader,
): Promise<ActivitiesView> {
  if (params.view === "rutin") {
    return { view: "rutin", routines: await listRoutines(db) };
  }
  if (params.view === "nonrutin") {
    return { view: "nonrutin", list: await listOneOffs(db, params.page) };
  }
  const { attendanceVisible } = reader;
  const [activities, residents, attendance] = await Promise.all([
    readDailyActivities(db, params.day),
    countResidentsByDorm(db, reader.visible),
    attendanceVisible === null
      ? null
      : readDayAttendance(db, params.day, attendanceVisible),
  ]);
  const count = reader.mayCount
    ? await loadCountPanel(
        db,
        activities,
        params.day,
        params.counted,
        reader.now,
      )
    : null;
  const { day } = params;
  return { view: "harian", day, activities, residents, count, attendance };
}
