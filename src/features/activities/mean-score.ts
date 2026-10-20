import {
  type AttendanceScore,
  attendanceScore,
  type MarkTally,
  meetingScore,
  type ScoredSchedule,
  scorePercent,
  totalScore,
} from "./attendance-score";
import { isInSemester, type PeriodParts, wasStudentIn } from "./participants";
import type { UploadRange } from "./upload-range";

/** A schedule of the running period, with what the score reads of it. */
export interface CountedSchedule extends UploadRange {
  id: string;
  /**
   * The semester of its PPKS activity, which decides whom it is meant
   * for, or null for a special or additional activity, which is meant for
   * those it names.
   */
  semester: number | null;
  isRequired: boolean;
}

/** Where an attendance stands when it changes the score. */
export type KeptStatus = "valid" | "dispensation";

/**
 * Students of one angkatan who stand the same at every schedule: their
 * valid attendances and dispensations, by the key of the schedule, and
 * who are marked alike at the meetings of the period. They all have the
 * same score, so it is counted once for all of them.
 */
export interface StudentGroup {
  cohortYear: number;
  kept: Readonly<Record<string, KeptStatus>>;
  /** The keys of the schedules of special or additional activities that name them. */
  chosenIn: readonly string[];
  marks: MarkTally;
  students: number;
}

/**
 * Whether a schedule of the period is meant for the students of a group.
 * One of a special or additional activity is meant for those it names
 * only when they were students in the period, as they see it only then.
 */
function isMeantFor(
  group: StudentGroup,
  schedule: CountedSchedule,
  period: PeriodParts,
): boolean {
  if (schedule.semester !== null) {
    return isInSemester(group.cohortYear, schedule.semester, period);
  }
  if (!wasStudentIn(group.cohortYear, period)) return false;
  return group.chosenIn.includes(schedule.id);
}

/** Rerata nilai kehadiran, and how many students it is the mean of. */
export interface MeanScore {
  /** The mean as a percentage with one decimal, or null with nobody. */
  percent: number | null;
  students: number;
}

/** The schedules of the period as the score reads them for one group. */
function scoredFor(
  group: StudentGroup,
  schedules: readonly CountedSchedule[],
  period: PeriodParts,
): ScoredSchedule[] {
  return schedules
    .filter((schedule) => isMeantFor(group, schedule, period))
    .map((schedule) => ({
      ...schedule,
      attendance: group.kept[schedule.id] ?? null,
    }));
}

/**
 * Nilai kehadiran kegiatan of each student of a group, on a day on
 * campus: the schedules of the period meant for them and their marks at
 * the meetings of the period, together.
 */
export function groupScore(
  group: StudentGroup,
  schedules: readonly CountedSchedule[],
  period: PeriodParts,
  today: string,
): AttendanceScore {
  const scored = scoredFor(group, schedules, period);
  return totalScore({
    activities: attendanceScore(scored, today),
    meetings: meetingScore(group.marks),
  });
}

/**
 * The mean of Nilai kehadiran kegiatan over the students who have one,
 * on a day on campus. Each student's score is counted by the same rule
 * as on their own page, over the schedules of the period meant for
 * their angkatan and those of special or additional activities they take
 * part in, and over their marks at the meetings of the period. A student
 * with nothing counted yet has no score and is left out of the mean.
 */
export function meanScore(
  groups: readonly StudentGroup[],
  schedules: readonly CountedSchedule[],
  period: PeriodParts,
  today: string,
): MeanScore {
  let total = 0;
  let students = 0;
  for (const group of groups) {
    const percent = scorePercent(groupScore(group, schedules, period, today));
    if (percent === null) continue;
    total += percent * group.students;
    students += group.students;
  }
  if (students === 0) return { percent: null, students: 0 };
  return { percent: Math.round((total / students) * 10) / 10, students };
}
