import { and, count, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import {
  activitySchedules,
  activityScheduleParticipants as chosen,
  ppksActivities,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { OF_SCHEDULE } from "./list-schedules";
import {
  type CountedSchedule,
  type MeanScore,
  meanScore,
  type StudentGroup,
} from "./mean-score";
import { markTallies } from "./meeting-marks";
import { newestAt } from "./newest-attendances";

const NO_SCORE: MeanScore = { percent: null, students: 0 };

/**
 * The schedules of a period the score is counted over: the required ones
 * that are not removed, of PPKS activities and of special and additional
 * ones. One that is not required never counts, so it is not read.
 */
export function readCounted(
  db: Database,
  periodId: string,
): Promise<CountedSchedule[]> {
  return db
    .select({
      id: activitySchedules.id,
      startsOn: activitySchedules.startsOn,
      endsOn: activitySchedules.endsOn,
      uploadCount: activitySchedules.uploadCount,
      uploadUnit: activitySchedules.uploadUnit,
      isRequired: activitySchedules.isRequired,
      semester: ppksActivities.semester,
    })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(
      and(
        eq(activitySchedules.academicPeriodId, periodId),
        eq(activitySchedules.isRequired, true),
        isNull(activitySchedules.deletedAt),
      ),
    );
}

/** A choice of a schedule's participants that names the student, their class or their angkatan. */
export const NAMES_STUDENT = sql`(${chosen.studentId} = ${students.id} or ${chosen.className} = ${students.className} or ${chosen.cohortYear} = ${students.cohortYear})`;

/**
 * The keys of the schedules among `extraIds` that name a student, their
 * class or their angkatan, in one order, so two students chosen alike
 * fall in one group.
 */
function chosenIn(extraIds: readonly string[]): SQL<string[]> {
  if (extraIds.length === 0) return sql<string[]>`'{}'::text[]`;
  return sql<
    string[]
  >`array(select distinct ${chosen.scheduleId}::text from ${chosen} where ${inArray(chosen.scheduleId, [...extraIds])} and ${NAMES_STUDENT} order by 1)`;
}

/** A count of marks of a student, or 0 for one on no meeting list. */
function markCount(column: SQL.Aliased<number>) {
  return sql<number>`coalesce(${column}, 0)`;
}

/**
 * What is read of each student: their angkatan, only what changes a
 * score, a valid attendance or a dispensation, the schedules of special
 * or additional activities they take part in, and how often each mark
 * was given them at the meetings of the period.
 */
function standingsOf(
  db: Database,
  schedules: readonly CountedSchedule[],
  periodId: string,
) {
  const scheduleIds = schedules.map((schedule) => schedule.id);
  const extraIds = schedules
    .filter((schedule) => schedule.semester === null)
    .map((schedule) => schedule.id);
  const newest = newestAt(db, scheduleIds);
  const tallies = markTallies(db, periodId);
  const changesScore = sql`${newest.status} in ('valid', 'dispensation')`;
  const columns = {
    cohortYear: students.cohortYear,
    kept: sql<
      StudentGroup["kept"]
    >`coalesce(jsonb_object_agg(${newest.scheduleId}, ${newest.status}) filter (where ${changesScore}), '{}'::jsonb)`.as(
      "kept",
    ),
    chosenIn: chosenIn(extraIds).as("chosen_in"),
    present: markCount(tallies.present).as("present"),
    excused: markCount(tallies.excused).as("excused"),
    sick: markCount(tallies.sick).as("sick"),
    absent: markCount(tallies.absent).as("absent"),
  };
  return { newest, tallies, columns };
}

type Standings = ReturnType<typeof standingsOf>;

/**
 * A read of students made one row for each Aktif student `visible` lets
 * through, joined to what `standings` reads of them.
 */
function perStudentRows<Query extends PgSelect>(
  query: Query,
  visible: SQL,
  standings: Standings,
) {
  const { newest, tallies } = standings;
  return query
    .leftJoin(newest, eq(newest.studentId, students.id))
    .leftJoin(tallies, eq(tallies.studentId, students.id))
    .where(and(ACTIVE_MEMBER, visible))
    .groupBy(
      students.id,
      tallies.present,
      tallies.excused,
      tallies.sick,
      tallies.absent,
    );
}

/** A student as the score reads them, with their key. */
export interface StudentStanding extends StudentGroup {
  studentId: string;
}

/**
 * Each Aktif student an account sees, with what their score is counted
 * from, for a list that shows each student's own score.
 */
export async function readStudentStandings(
  db: Database,
  visible: SQL,
  schedules: readonly CountedSchedule[],
  periodId: string,
): Promise<StudentStanding[]> {
  const standings = standingsOf(db, schedules, periodId);
  const query = db
    .select({ studentId: students.id, ...standings.columns })
    .from(students)
    .$dynamic();
  const rows = await perStudentRows(query, visible, standings);
  return rows.map(({ present, excused, sick, absent, ...row }) => ({
    ...row,
    marks: { present, excused, sick, absent },
    students: 1,
  }));
}

/**
 * The Aktif students an account sees, put together in the database into
 * groups that stand the same at every one of the schedules and are marked
 * alike at the meetings of the period. So one row comes back for many
 * students, and nobody is named.
 */
async function readGroups(
  db: Database,
  visible: SQL,
  schedules: readonly CountedSchedule[],
  periodId: string,
): Promise<StudentGroup[]> {
  const standings = standingsOf(db, schedules, periodId);
  const query = db.select(standings.columns).from(students).$dynamic();
  const perStudent = perStudentRows(query, visible, standings).as(
    "per_student",
  );
  const rows = await db
    .select({
      cohortYear: perStudent.cohortYear,
      kept: perStudent.kept,
      chosenIn: perStudent.chosenIn,
      present: perStudent.present,
      excused: perStudent.excused,
      sick: perStudent.sick,
      absent: perStudent.absent,
      students: count(),
    })
    .from(perStudent)
    .groupBy(
      perStudent.cohortYear,
      perStudent.kept,
      perStudent.chosenIn,
      perStudent.present,
      perStudent.excused,
      perStudent.sick,
      perStudent.absent,
    );
  return rows.map(({ present, excused, sick, absent, ...row }) => ({
    ...row,
    marks: { present, excused, sick, absent },
  }));
}

/**
 * Rerata nilai kehadiran of the students an account sees, over the
 * period that runs on `today`. `visible` limits the students, so Ketua
 * Program Studi and Pengasuh get the mean of their own students only.
 * Each schedule and each meeting counts in the period it keeps only.
 */
export async function readMeanScore(
  db: Database,
  visible: SQL,
  today: string,
): Promise<MeanScore> {
  const running = runningPeriodOn(await readAcademicPeriods(db), today);
  if (running === null) return NO_SCORE;
  const schedules = await readCounted(db, running.id);
  const groups = await readGroups(db, visible, schedules, running.id);
  return meanScore(groups, schedules, running, today);
}
