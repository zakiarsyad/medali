import { rerataTenths } from "@/character-scores/assessment-score";

/**
 * Students who stand alike for the numbers of the tab: how many, and
 * the total of the six scores of their latest assessment and whether it
 * was made in the running period, or null for those with none.
 */
export interface LatestGroup {
  students: number;
  latest: { total: number; inRunningPeriod: boolean } | null;
}

/** The four numbers at the top of the tab, and how many students there are. */
export interface AssessmentNumbers {
  students: number;
  /** Sudah diasesmen: with any assessment, from whatever period. */
  assessed: number;
  /** Diasesmen semester ini: whose latest one was made in the running period. */
  assessedThisPeriod: number;
  /** Belum diasesmen: with none. */
  notAssessed: number;
  /** Rerata capaian: the average of their latest Rerata, or null for none. */
  meanRerata: number | null;
}

/**
 * Works out the numbers. Only a student's latest assessment counts, and
 * it counts until a newer one is saved: a new semester does not make a
 * student "Belum diasesmen" again.
 */
export function countAssessed(
  groups: readonly LatestGroup[],
): AssessmentNumbers {
  let students = 0;
  let assessed = 0;
  let assessedThisPeriod = 0;
  let tenths = 0;
  for (const group of groups) {
    students += group.students;
    if (group.latest === null) continue;
    assessed += group.students;
    if (group.latest.inRunningPeriod) assessedThisPeriod += group.students;
    tenths += rerataTenths(group.latest.total) * group.students;
  }
  const meanRerata = assessed === 0 ? null : Math.round(tenths / assessed) / 10;
  return {
    students,
    assessed,
    assessedThisPeriod,
    notAssessed: students - assessed,
    meanRerata,
  };
}
