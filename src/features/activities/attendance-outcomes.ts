import { activityAttendanceStatus } from "@/db/schema";
import type { AttendanceMark } from "@/mentoring/meeting-ids";
import {
  type AttendanceScore,
  attendanceScore,
  meetingScore,
  NO_MARKS,
} from "./attendance-score";
import type { AttendanceStatus } from "./attendance-status";
import {
  type CountedSchedule,
  isForNamedOnly,
  isOpenToCohort,
} from "./mean-score";
import type { PeriodParts } from "./participants";

/*
 * Nilai kehadiran kegiatan adds up what each schedule and each meeting
 * mark gives a student. These tables say what that is, by the one rule,
 * so a database that works out many students' scores only adds them up
 * and never holds a rule of its own.
 */

/** Each way a student can stand at a schedule: nothing sent, or a status. */
const STANDINGS: readonly (AttendanceStatus | null)[] = [
  null,
  ...activityAttendanceStatus.enumValues,
];

/** What one schedule adds for students of an angkatan who stand one way there. */
export interface ScheduleOutcome extends AttendanceScore {
  scheduleId: string;
  cohortYear: number;
  /** The status of the student's newest attendance there; null for none. */
  status: AttendanceStatus | null;
  /** Whether it adds this only for the students the schedule names. */
  namedOnly: boolean;
}

function outcomesAt(
  schedule: CountedSchedule,
  cohortYear: number,
  today: string,
): ScheduleOutcome[] {
  const outcomes: ScheduleOutcome[] = [];
  for (const status of STANDINGS) {
    const score = attendanceScore([{ ...schedule, attendance: status }], today);
    const addsNothing = score.attended === 0 && score.counted === 0;
    if (addsNothing) continue;
    outcomes.push({
      scheduleId: schedule.id,
      cohortYear,
      status,
      namedOnly: isForNamedOnly(schedule),
      ...score,
    });
  }
  return outcomes;
}

/**
 * What each schedule of the period adds, on a day on campus, for the
 * students of each of some angkatan, for each way they can stand there.
 * What adds nothing is left out, so the table stays small.
 */
export function scheduleOutcomes(
  schedules: readonly CountedSchedule[],
  cohortYears: readonly number[],
  period: PeriodParts,
  today: string,
): ScheduleOutcome[] {
  const outcomes: ScheduleOutcome[] = [];
  for (const schedule of schedules) {
    for (const cohortYear of cohortYears) {
      if (!isOpenToCohort(cohortYear, schedule, period)) continue;
      outcomes.push(...outcomesAt(schedule, cohortYear, today));
    }
  }
  return outcomes;
}

function markOutcome(mark: AttendanceMark): AttendanceScore {
  return meetingScore({ ...NO_MARKS, [mark]: 1 });
}

/** What one mark at a meeting of the period adds. */
export function markOutcomes(): Record<AttendanceMark, AttendanceScore> {
  return {
    present: markOutcome("present"),
    excused: markOutcome("excused"),
    sick: markOutcome("sick"),
    absent: markOutcome("absent"),
  };
}
