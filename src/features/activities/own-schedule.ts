import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  academicPeriods,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import type { OwnStudent } from "./own-student";
import { isInSemester } from "./participants";
import type { StatusParts } from "./schedule-status";
import { hourAndMinute } from "./stored-time";

/** A schedule a student takes part in, with what its status is told from. */
export interface OwnSchedule extends StatusParts {
  id: string;
}

/**
 * One schedule, when it is meant for a student: not removed, and of an
 * activity of the semester the student is in during the period the
 * schedule keeps. Null otherwise, and for a student who is not Aktif.
 * `id` comes from outside and is not trusted.
 */
export async function readOwnSchedule(
  db: Database,
  student: OwnStudent,
  id: string,
): Promise<OwnSchedule | null> {
  if (!student.isActive || !isUuid(id)) return null;
  const [found] = await db
    .select({
      id: activitySchedules.id,
      startsOn: activitySchedules.startsOn,
      endsOn: activitySchedules.endsOn,
      startTime: activitySchedules.startTime,
      uploadCount: activitySchedules.uploadCount,
      uploadUnit: activitySchedules.uploadUnit,
      semester: ppksActivities.semester,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
    })
    .from(activitySchedules)
    .innerJoin(
      ppksActivities,
      eq(ppksActivities.id, activitySchedules.activityId),
    )
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, activitySchedules.academicPeriodId),
    )
    .where(
      and(eq(activitySchedules.id, id), isNull(activitySchedules.deletedAt)),
    );
  // A special or additional activity has no semester and is not PPKS.
  if (!found || found.semester === null) return null;
  const { semester, startYear, term, ...schedule } = found;
  if (!isInSemester(student.cohortYear, semester, { startYear, term })) {
    return null;
  }
  return { ...schedule, startTime: hourAndMinute(schedule.startTime) };
}
