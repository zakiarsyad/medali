import type { SamplePeriod } from "./sample-data";
import type { SampleMentorGroup } from "./sample-mentor-groups";

/*
 * Made-up people only. Every value and note here is invented.
 */

export interface SampleMentorEvaluation {
  group: SampleMentorGroup;
  period: SamplePeriod;
  activity: number;
  attendance: number;
  achievement: number;
  feedback: number;
  note: string | null;
}

type Values = Omit<SampleMentorEvaluation, "group" | "period">;

/** One for each group evaluated for the period before: Baik, Cukup, Kurang, Baik. */
const VALUES_BEFORE: Values[] = [
  {
    activity: 88,
    attendance: 90,
    achievement: 84,
    feedback: 86,
    note: "Catatan pengasuhan rutin dan lengkap.",
  },
  {
    activity: 72,
    attendance: 78,
    achievement: 70,
    feedback: 74,
    note: null,
  },
  {
    activity: 55,
    attendance: 62,
    achievement: 60,
    feedback: 58,
    note: "Pertemuan rutin sering tidak terlaksana. Perlu rencana perbaikan.",
  },
  {
    activity: 82,
    attendance: 85,
    achievement: 79,
    feedback: 88,
    note: null,
  },
];

/** The first group again, for the running period: Cukup. */
const VALUES_RUNNING: Values = {
  activity: 78,
  attendance: 80,
  achievement: 76,
  feedback: 79,
  note: "Evaluasi tengah periode.",
};

/**
 * A few made-up evaluations of the sample groups. Only groups of an
 * angkatan that came before the running period have one: the first four
 * for the period before, and the first of them also for the running one.
 * `periods` are the sample periods, the running one first.
 */
export function sampleMentorEvaluations(
  groups: SampleMentorGroup[],
  periods: SamplePeriod[],
): SampleMentorEvaluation[] {
  const [running, before] = periods;
  if (!running || !before) return [];
  const older = groups.filter((group) => group.cohortYear < running.startYear);
  const evaluations: SampleMentorEvaluation[] = [];
  for (const [place, values] of VALUES_BEFORE.entries()) {
    const group = older[place];
    if (group) evaluations.push({ group, period: before, ...values });
  }
  const [first] = older;
  if (first) {
    evaluations.push({ group: first, period: running, ...VALUES_RUNNING });
  }
  return evaluations;
}
