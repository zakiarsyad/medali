import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { isDormSemester } from "./resident-rule";

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
  return cohorts
    .map((cohort) => cohort.year)
    .filter((year) => isDormSemester(studentSemester(year, period)));
}
