import { and, count, eq, lte, or, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { takingPartIn } from "./chosen-students";
import { readCohortCounts } from "./cohort-counts";
import { listedSchedules, OF_SCHEDULE, ofKind } from "./list-schedules";
import type { MeanScore } from "./mean-score";
import { type CohortCount, semestersByPeriod } from "./participants";
import { readMeanScore } from "./read-mean-score";
import type { ScheduleKind, ScheduleScope } from "./schedule-list-address";
import { ofSemesterIn } from "./student-schedules";
import { IS_CARD, OF_ATTENDANCE } from "./verification-cards";

/** The four numbers above the list of schedules. */
export interface AttendanceNumbers {
  /** Rerata nilai kehadiran of the students the account sees. */
  mean: MeanScore;
  /** The required schedules that have started. */
  held: number;
  /** The photos of the students the account sees that wait to be checked. */
  waiting: number;
  /** The schedules that start after today. */
  coming: number;
}

/** The schedules of a scope, by whether they have started. */
async function countSchedules(
  db: Database,
  scope: ScheduleScope,
  today: string,
) {
  const { isRequired, startsOn } = activitySchedules;
  const [counted] = await db
    .select({
      held: sql<number>`count(*) filter (where ${isRequired} and ${startsOn} <= ${today})::int`,
      coming: sql<number>`count(*) filter (where ${startsOn} > ${today})::int`,
    })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(listedSchedules(scope));
  return counted ?? { held: 0, coming: 0 };
}

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
async function countedAt(db: Database, kind: ScheduleKind): Promise<SQL> {
  if (kind === "extra") return takingPartIn(activitySchedules.id);
  const [cohorts, periods] = await Promise.all([
    readCohortCounts(db),
    readAcademicPeriods(db),
  ]);
  return meantByCohort(cohorts, periods);
}

/**
 * The photos that wait, at the schedules of the activities of a kind that
 * have started by `today`: one moved to later dates counts from its first
 * day on.
 */
async function countWaiting(
  db: Database,
  visible: SQL,
  kind: ScheduleKind,
  today: string,
): Promise<number> {
  const counted = await countedAt(db, kind);
  const [waiting] = await db
    .select({ waiting: count() })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .innerJoin(students, eq(students.id, activityAttendances.studentId))
    .where(
      and(
        IS_CARD,
        ofKind(kind),
        eq(activityAttendances.status, "waiting"),
        visible,
        counted,
        lte(activitySchedules.startsOn, today),
      ),
    );
  return waiting?.waiting ?? 0;
}

/**
 * The numbers above "Jadwal dan kehadiran" of a tab on a day on campus.
 * The two that count schedules follow the scope, with its tahap, and the
 * photos that wait are those of the tab's kind of activity. The mean
 * holds every kind. The two that count students are limited by `visible`
 * to those the account sees, so Ketua Program Studi and Pengasuh get the
 * numbers of their own students only.
 */
export async function readAttendanceNumbers(
  db: Database,
  visible: SQL,
  scope: ScheduleScope,
  today: string,
): Promise<AttendanceNumbers> {
  const [mean, schedules, waiting] = await Promise.all([
    readMeanScore(db, visible, today),
    countSchedules(db, scope, today),
    countWaiting(db, visible, scope.kind, today),
  ]);
  return { mean, ...schedules, waiting };
}
