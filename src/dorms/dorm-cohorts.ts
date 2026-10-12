import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { isDormSemester } from "./resident-rule";

/**
 * Those of the angkatan years given whose students are, in a period, in a
 * semester that lives in the dorm. None while no academic period runs: no
 * semester is known then, so only Internasional and Pembibitan students
 * are residents.
 */
export function dormCohortsOf(
  cohortYears: readonly number[],
  period: Pick<AcademicPeriod, "startYear" | "term"> | null,
): number[] {
  if (period === null) return [];
  return cohortYears.filter((year) =>
    isDormSemester(studentSemester(year, period)),
  );
}

/**
 * The angkatan years whose students are, on a day, in a semester that
 * lives in the dorm. Today when no day is given. Null when no academic
 * period runs, so that this is never taken for "no angkatan lives there".
 */
export async function readDormCohorts(
  db: Database,
  day?: string,
): Promise<number[] | null> {
  const period = await readRunningPeriod(db, day);
  if (!period) return null;
  const cohorts = await db
    .selectDistinct({ year: students.cohortYear })
    .from(students);
  const years = cohorts.map((cohort) => cohort.year);
  return dormCohortsOf(years, period);
}
