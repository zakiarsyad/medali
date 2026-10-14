import { asc, eq, inArray, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { alias, QueryBuilder } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  activitySchedules,
  activityScheduleParticipants as chosen,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import {
  type CandidateStudent,
  choiceOf,
  type ParticipantChoice,
} from "./chosen-participants";

/**
 * The students a schedule of a special or additional activity names, by
 * name, by the class they are in now or by the angkatan they are in now,
 * whatever their status: `isChosen` as a condition on the students in
 * the database. `scheduleId` is the key of the schedule, or the column
 * that holds it in the query this goes in.
 */
export function chosenBy(scheduleId: SQLWrapper | string): SQL {
  return sql`exists (select 1 from ${chosen} where ${chosen.scheduleId} = ${scheduleId} and (${chosen.studentId} = ${students.id} or ${chosen.className} = ${students.className} or ${chosen.cohortYear} = ${students.cohortYear}))`;
}

/**
 * The schedules of special or additional activities that name one
 * student, by name, by the class they are in now or by the angkatan they
 * are in now: `isChosen` as a condition on the schedules in the
 * database. Whether the student is Aktif is for the caller to ask.
 */
export function naming(student: Omit<CandidateStudent, "isActive">): SQL {
  const byClass =
    student.className === null
      ? sql`false`
      : sql`${chosen.className} = ${student.className}`;
  return sql`exists (select 1 from ${chosen} where ${chosen.scheduleId} = ${activitySchedules.id} and (${chosen.studentId} = ${student.id} or ${byClass} or ${chosen.cohortYear} = ${student.cohortYear}))`;
}

/**
 * The students who were students during a period, by its first year:
 * `wasStudentIn` as a condition on the students in the database.
 */
export function studentsDuring(startYear: SQLWrapper | number): SQL {
  return sql`${students.cohortYear} <= ${startYear}`;
}

// Named apart, so the schedule of an outer query is never mistaken for it.
const ownSchedule = alias(activitySchedules, "own_schedule");
const ownPeriod = alias(academicPeriods, "own_period");

/** The first year of the period a schedule keeps, as a value in a query. */
function startYearOf(scheduleId: SQLWrapper | string): SQL {
  const found = new QueryBuilder()
    .select({ startYear: ownPeriod.startYear })
    .from(ownSchedule)
    .innerJoin(ownPeriod, eq(ownPeriod.id, ownSchedule.academicPeriodId))
    .where(eq(ownSchedule.id, scheduleId));
  return sql`(${found})`;
}

/**
 * The students a schedule of a special or additional activity is meant
 * for, whatever their status: those it names who were students in the
 * period it keeps.
 */
export function meantByChoice(scheduleId: SQLWrapper | string): SQL {
  return sql`${chosenBy(scheduleId)} and ${studentsDuring(startYearOf(scheduleId))}`;
}

/**
 * The students who take part in a schedule of a special or additional
 * activity: the Aktif ones it is meant for. `takesPart` as a condition
 * on the students in the database.
 */
export function takingPartIn(scheduleId: SQLWrapper | string): SQL {
  return sql`(${ACTIVE_MEMBER}) and ${meantByChoice(scheduleId)}`;
}

/**
 * The participant choice of each of some schedules of special or
 * additional activities, by the key of the schedule.
 */
export async function readParticipantChoices(
  db: Database,
  scheduleIds: readonly string[],
): Promise<Map<string, ParticipantChoice>> {
  const choices = new Map<string, ParticipantChoice>();
  if (scheduleIds.length === 0) return choices;
  const rows = await db
    .select({
      scheduleId: chosen.scheduleId,
      studentId: chosen.studentId,
      className: chosen.className,
      cohortYear: chosen.cohortYear,
    })
    .from(chosen)
    .where(inArray(chosen.scheduleId, [...scheduleIds]))
    .orderBy(
      asc(chosen.className),
      asc(chosen.cohortYear),
      asc(chosen.studentId),
    );
  for (const scheduleId of scheduleIds) {
    const own = rows.filter((row) => row.scheduleId === scheduleId);
    choices.set(scheduleId, choiceOf(own));
  }
  return choices;
}
