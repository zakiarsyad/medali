import { and, count, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
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
import { newestAt } from "./newest-attendances";

const NO_SCORE: MeanScore = { percent: null, students: 0 };

/**
 * The schedules of a period the score is counted over: the required ones
 * that are not removed, of PPKS activities and of special and additional
 * ones. One that is not required never counts, so it is not read.
 */
function readCounted(
  db: Database,
  periodId: string,
): Promise<CountedSchedule[]> {
  return db
    .select({
      id: activitySchedules.id,
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

/**
 * The keys of the schedules among `extraIds` that name a student, their
 * class or their angkatan, in one order, so two students chosen alike
 * fall in one group.
 */
function chosenIn(extraIds: readonly string[]): SQL<string[]> {
  if (extraIds.length === 0) return sql<string[]>`'{}'::text[]`;
  const names = sql`(${chosen.studentId} = ${students.id} or ${chosen.className} = ${students.className} or ${chosen.cohortYear} = ${students.cohortYear})`;
  return sql<
    string[]
  >`array(select distinct ${chosen.scheduleId}::text from ${chosen} where ${inArray(chosen.scheduleId, [...extraIds])} and ${names} order by 1)`;
}

/**
 * The Aktif students an account sees, put together in the database into
 * groups that stand the same at every one of the schedules: only what
 * changes a score is kept of each, a valid attendance or a dispensation,
 * with the schedules of special or additional activities they take part
 * in. So one row comes back for many students, and nobody is named.
 */
function readGroups(
  db: Database,
  visible: SQL,
  schedules: readonly CountedSchedule[],
): Promise<StudentGroup[]> {
  const scheduleIds = schedules.map((schedule) => schedule.id);
  const extraIds = schedules
    .filter((schedule) => schedule.semester === null)
    .map((schedule) => schedule.id);
  const newest = newestAt(db, scheduleIds);
  const changesScore = sql`${newest.status} in ('valid', 'dispensation')`;
  const perStudent = db
    .select({
      cohortYear: students.cohortYear,
      kept: sql<
        StudentGroup["kept"]
      >`coalesce(jsonb_object_agg(${newest.scheduleId}, ${newest.status}) filter (where ${changesScore}), '{}'::jsonb)`.as(
        "kept",
      ),
      chosenIn: chosenIn(extraIds).as("chosen_in"),
    })
    .from(students)
    .leftJoin(newest, eq(newest.studentId, students.id))
    .where(and(ACTIVE_MEMBER, visible))
    .groupBy(students.id)
    .as("per_student");
  return db
    .select({
      cohortYear: perStudent.cohortYear,
      kept: perStudent.kept,
      chosenIn: perStudent.chosenIn,
      students: count(),
    })
    .from(perStudent)
    .groupBy(perStudent.cohortYear, perStudent.kept, perStudent.chosenIn);
}

/**
 * Rerata nilai kehadiran of the students an account sees, over the
 * period that runs on `today`. `visible` limits the students, so Ketua
 * Program Studi and Pengasuh get the mean of their own students only.
 * Each schedule counts in the period it keeps only.
 */
export async function readMeanScore(
  db: Database,
  visible: SQL,
  today: string,
): Promise<MeanScore> {
  const running = runningPeriodOn(await readAcademicPeriods(db), today);
  if (running === null) return NO_SCORE;
  const schedules = await readCounted(db, running.id);
  if (schedules.length === 0) return NO_SCORE;
  const groups = await readGroups(db, visible, schedules);
  return meanScore(groups, schedules, running, today);
}
