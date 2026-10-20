import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { studentSemester } from "@/academic-periods/student-semester";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** A period as the semester of a day needs it. */
export type PeriodOfDay = Pick<
  AcademicPeriod,
  "startYear" | "term" | "startsOn"
>;

/**
 * The semester a student of an angkatan is in on a day: that of the
 * academic period the day falls in. Null for a day in none.
 */
export function semesterOnDay(
  cohortYear: number,
  periods: readonly PeriodOfDay[],
  day: string,
): number | null {
  const period = runningPeriodOn(periods, day);
  if (period === null) return null;
  return studentSemester(cohortYear, period);
}
