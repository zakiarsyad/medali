import { inArray, type SQL } from "drizzle-orm";
import { students } from "@/db/schema";
import { meantByChoice } from "./chosen-students";
import { type CohortCount, meantCohortYears } from "./participants";
import type { ScheduleRow } from "./schedule-row";

type Meant = Pick<ScheduleRow, "id" | "target" | "period">;

/**
 * The students a schedule is meant for, whatever their status, as a
 * condition on the students: for a PPKS activity those of the angkatan in
 * its semester during the period it keeps, and for an extra activity
 * those it names who were students in that period. Undefined when it is meant for no angkatan. The caller
 * keeps only the Aktif ones.
 */
export function meantStudents(
  schedule: Meant,
  cohorts: readonly CohortCount[],
): SQL | undefined {
  const { target } = schedule;
  if (target.kind === "chosen") return meantByChoice(schedule.id);
  const years = meantCohortYears(cohorts, target.semester, schedule.period);
  if (years.length === 0) return undefined;
  return inArray(students.cohortYear, years);
}
