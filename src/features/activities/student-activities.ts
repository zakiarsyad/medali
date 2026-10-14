import type { CampusMoment } from "@/academic-periods/campus-clock";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { type AttendanceScore, attendanceScore } from "./attendance-score";
import type { AttendanceStatus } from "./attendance-status";
import type { ShownClarification } from "./clarification-time";
import { readOwnClarifications } from "./own-clarifications";
import { readOwnStudent } from "./own-student";
import { semestersByPeriod } from "./participants";
import { scheduleStatus } from "./schedule-status";
import type { StudentSchedule } from "./student-schedule";
import {
  meantFor,
  readAllSchedules,
  readBegunSchedules,
  readComingSchedules,
  readOwnAttendances,
  readPastSchedules,
  type ScheduleHistory,
} from "./student-schedules";

/** What Kegiatan karakter shows a student of their own activities. */
export interface StudentActivities {
  /** The moment on campus every status here is told at. */
  now: CampusMoment;
  /** The semester they are in now, or null while none is known. */
  semester: number | null;
  /** Nilai kehadiran kegiatan, over the running period. */
  score: AttendanceScore;
  /** The photos of the running period that wait to be checked. */
  waiting: number;
  /** The dispensations of the running period. */
  dispensations: number;
  /** The schedules that run today or still take photos. */
  current: StudentSchedule[];
  /** The next few schedules. */
  coming: StudentSchedule[];
  history: ScheduleHistory;
  /**
   * Their newest clarification for each schedule of the history shown, by
   * the key of the schedule. A schedule they never asked about has none.
   */
  clarifications: Record<string, ShownClarification>;
}

export type StudentActivitiesAnswer =
  | { kind: "refused" }
  | { kind: "found"; activities: StudentActivities };

/** Whether a schedule runs or takes photos at a moment. */
export function isCurrent(
  schedule: StudentSchedule,
  now: CampusMoment,
): boolean {
  const status = scheduleStatus(schedule, now);
  return status === "open" || status === "not_open_yet";
}

function countWith(
  schedules: readonly StudentSchedule[],
  status: AttendanceStatus,
): number {
  return schedules.filter((each) => each.attendance?.status === status).length;
}

function scored(schedule: StudentSchedule) {
  return { ...schedule, attendance: schedule.attendance?.status ?? null };
}

/**
 * The activities of the student of an account, at a moment: the running
 * and the coming ones, one page of the history, and the numbers of the
 * running period. Only schedules meant for them are read, and only their
 * own attendance. A student who is not Aktif takes part in none. An
 * account without the right, or with no student record of its own, is
 * refused. `keepsFiles` is whether this place has a file storage.
 */
export async function readStudentActivities(
  db: Database,
  account: AccountForAccess,
  at: Date,
  historyPage: number,
  keepsFiles: boolean,
): Promise<StudentActivitiesAnswer> {
  const student = await readOwnStudent(db, account);
  if (student === null) return { kind: "refused" };
  const now = { day: campusDay(at), time: campusTime(at) };
  const periods = await readAcademicPeriods(db);
  const semesters = student.isActive
    ? semestersByPeriod(student.cohortYear, periods)
    : [];
  const running = runningPeriodOn(periods, now.day);
  const ofRunning = semesters.filter(
    ({ periodId }) => periodId === running?.id,
  );
  const meant = meantFor(semesters, student);

  const [begun, coming, history, counted] = await Promise.all([
    readBegunSchedules(db, meant, now.day),
    readComingSchedules(db, meant, now.day),
    readPastSchedules(db, meant, now.day, historyPage),
    readAllSchedules(db, meantFor(ofRunning, student)),
  ]);
  const current = begun.filter((schedule) => isCurrent(schedule, now));
  const attended = [...current, ...history.schedules, ...counted];
  const [attendances, clarifications] = await Promise.all([
    readOwnAttendances(
      db,
      student.id,
      attended.map((schedule) => schedule.id),
    ),
    readOwnClarifications(
      db,
      student.id,
      history.schedules.map((schedule) => schedule.id),
      keepsFiles,
    ),
  ]);
  function withOwn(schedule: StudentSchedule): StudentSchedule {
    return { ...schedule, attendance: attendances.get(schedule.id) ?? null };
  }
  const countedOwn = counted.map(withOwn);

  return {
    kind: "found",
    activities: {
      now,
      semester: ofRunning[0]?.semester ?? null,
      score: attendanceScore(countedOwn.map(scored), now.day),
      waiting: countWith(countedOwn, "waiting"),
      dispensations: countWith(countedOwn, "dispensation"),
      current: current.map(withOwn),
      coming,
      history: { ...history, schedules: history.schedules.map(withOwn) },
      clarifications: Object.fromEntries(clarifications),
    },
  };
}
