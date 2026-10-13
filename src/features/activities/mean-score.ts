import {
  attendanceScore,
  type ScoredSchedule,
  scorePercent,
} from "./attendance-score";
import { isInSemester, type PeriodParts } from "./participants";
import type { UploadRange } from "./upload-range";

/** A schedule of the running period, with what the score reads of it. */
export interface CountedSchedule extends UploadRange {
  id: string;
  /** The semester of its activity, which decides whom it is meant for. */
  semester: number;
  isRequired: boolean;
}

/** Where an attendance stands when it changes the score. */
export type KeptStatus = "valid" | "dispensation";

/**
 * Students of one angkatan who stand the same at every schedule: their
 * valid attendances and dispensations, by the key of the schedule. They
 * all have the same score, so it is counted once for all of them.
 */
export interface StudentGroup {
  cohortYear: number;
  kept: Readonly<Record<string, KeptStatus>>;
  students: number;
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
    .filter(({ semester }) => isInSemester(group.cohortYear, semester, period))
    .map((schedule) => ({
      ...schedule,
      attendance: group.kept[schedule.id] ?? null,
    }));
}

/**
 * The mean of Nilai kehadiran kegiatan over the students who have one,
 * on a day on campus. Each student's score is counted by the same rule
 * as on their own page, over the schedules of the period meant for
 * their angkatan. A student with nothing counted yet has no score and
 * is left out of the mean.
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
    const score = attendanceScore(scoredFor(group, schedules, period), today);
    const percent = scorePercent(score);
    if (percent === null) continue;
    total += percent * group.students;
    students += group.students;
  }
  if (students === 0) return { percent: null, students: 0 };
  return { percent: Math.round((total / students) * 10) / 10, students };
}
