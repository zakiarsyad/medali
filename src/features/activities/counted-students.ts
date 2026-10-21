import { eq, or, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { activitySchedules, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { takingPartIn } from "./chosen-students";
import { readCohortCounts } from "./cohort-counts";
import { ofKind } from "./list-schedules";
import { type CohortCount, semestersByPeriod } from "./participants";
import type { ScheduleKind } from "./schedule-list-address";
import { ofSemesterIn } from "./student-schedules";

/**
 * The Aktif students a PPKS schedule is meant for: those of an angkatan
 * in the semester of its activity during the period it keeps, by the rule
 * the student's own page chooses their schedules with.
 */
function meantByCohort(
  cohorts: readonly CohortCount[],
  periods: readonly AcademicPeriod[],
): SQL {
  const meant: SQL[] = [];
  for (const { cohortYear } of cohorts) {
    const ofSemester = ofSemesterIn(semestersByPeriod(cohortYear, periods));
    if (ofSemester === undefined) continue;
    meant.push(sql`${eq(students.cohortYear, cohortYear)} and (${ofSemester})`);
  }
  const ofAny = or(...meant) ?? sql`false`;
  return sql`(${ACTIVE_MEMBER}) and (${ofAny})`;
}

/**
 * The students whose photos count at the schedules of a kind: only those
 * a schedule is meant for now, as for Hadir. The photo of a student taken
 * out of an extra activity, or of one whose PPKS schedule moved to a
 * period in which their angkatan is in another semester, stays to be
 * decided but counts nowhere.
 */
export async function countedAt(
  db: Database,
  kind: ScheduleKind,
): Promise<SQL> {
  if (kind === "extra") return takingPartIn(activitySchedules.id);
  const [cohorts, periods] = await Promise.all([
    readCohortCounts(db),
    readAcademicPeriods(db),
  ]);
  return meantByCohort(cohorts, periods);
}

/**
 * The students whose photos count at a schedule of either kind, by the
 * same rule as at one kind. The query this goes in holds the schedule,
 * its activity and the student.
 */
export async function countedAtEither(db: Database): Promise<SQL> {
  const [ppks, extra] = await Promise.all([
    countedAt(db, "ppks"),
    countedAt(db, "extra"),
  ]);
  return sql`((${ofKind("ppks")}) and (${ppks})) or ((${ofKind("extra")}) and (${extra}))`;
}
