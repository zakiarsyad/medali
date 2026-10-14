import { asc, inArray, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants as chosen, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { choiceOf, type ParticipantChoice } from "./chosen-participants";

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
 * The students who take part in a schedule of a special or additional
 * activity: the Aktif ones it names. `takesPart` as a condition on the
 * students in the database.
 */
export function takingPartIn(scheduleId: SQLWrapper | string): SQL {
  return sql`(${ACTIVE_MEMBER}) and ${chosenBy(scheduleId)}`;
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
