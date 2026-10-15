import type { SQL } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import type { SemesterChoice } from "./rekap-filters";
import type { StaffViolationParams } from "./violation-address";
import { type Announcement, readAnnouncement } from "./violation-announcement";
import {
  type Rekap,
  readStudentViolations,
  readViolationNumbers,
  readViolationRekap,
  type StudentViolations,
  type ViolationNumbers,
} from "./violation-board";
import { periodDays } from "./violation-periods";
import { readLetterMarks } from "./warning-calls";
import type { WarningLevel } from "./warning-ids";

/** What the staff screen of Pelanggaran shows, but Jadwal publikasi. */
export interface StaffViolations {
  numbers: ViolationNumbers;
  announcement: Announcement;
  rekap: Rekap;
  semesters: SemesterChoice[];
  /** The semester shown, or null while no period is stored. */
  semester: SemesterChoice | null;
  /** The student whose box is open, or null for none. */
  student: StudentViolations | null;
  /** The highest SP of the semester of each student of the rekap page who has one. */
  marks: Record<string, WarningLevel>;
}

const NO_REKAP: Rekap = { rows: [], matching: 0, page: 1 };

/** The semester asked for when it is stored, or else the running one. */
function semesterOf(
  periods: AcademicPeriod[],
  asked: string | null,
  today: string,
): AcademicPeriod | null {
  const chosen = periods.find((period) => period.id === asked);
  return chosen ?? runningPeriodOn(periods, today);
}

/**
 * Everything the staff screen reads, of the students `visible` holds, at
 * `now` by the server's clock: the numbers, one day of the announcement,
 * the rekap of the semester with the SP of each student, and the box of
 * one student.
 */
export async function readStaffViolations(
  db: Database,
  visible: SQL,
  params: StaffViolationParams,
  now: Date,
): Promise<StaffViolations> {
  const periods = await readAcademicPeriods(db);
  const period = semesterOf(periods, params.periodId, campusDay(now));
  const days = period === null ? null : periodDays(periods, period.id);
  const { studentId } = params;
  // Read side by side: none of them waits for another.
  const [announcement, numbers, rekap, student] = await Promise.all([
    readAnnouncement(db, visible, now, params.day, params.announcementPage),
    readViolationNumbers(db, visible, now, days),
    days === null
      ? NO_REKAP
      : readViolationRekap(db, visible, now, days, params.query, params.page),
    days === null || studentId === null
      ? null
      : readStudentViolations(
          db,
          visible,
          studentId,
          now,
          days,
          params.studentPage,
        ),
  ]);
  const semesters = periods.map((each) => ({
    id: each.id,
    title: periodTitle(each),
  }));
  const semester =
    period === null ? null : { id: period.id, title: periodTitle(period) };
  const marks =
    period === null
      ? {}
      : await readLetterMarks(
          db,
          period.id,
          rekap.rows.map((row) => row.studentId),
        );
  return { numbers, announcement, rekap, semesters, semester, student, marks };
}
