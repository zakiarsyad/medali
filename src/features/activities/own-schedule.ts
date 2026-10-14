import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  academicPeriods,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { takesPart } from "./chosen-participants";
import type { OwnStudent } from "./own-student";
import { isInSemester, type PeriodParts, semesterIn } from "./participants";
import { readStoredChoice } from "./save-participants";
import type { StatusParts } from "./schedule-status";

/** A schedule a student takes part in, with what its status is told from. */
export interface OwnSchedule extends StatusParts {
  id: string;
}

/**
 * Whether a schedule of a special or additional activity is meant for a
 * student: they were a student in the period it keeps, and it names
 * them, their class or their angkatan.
 */
async function isChosenFor(
  db: Database,
  student: OwnStudent,
  scheduleId: string,
  period: PeriodParts,
): Promise<boolean> {
  if (semesterIn(student.cohortYear, period) === null) return false;
  const choice = await readStoredChoice(db, scheduleId);
  return choice !== null && takesPart(student, choice);
}

/**
 * One schedule, when it is meant for a student: not removed, and of an
 * activity of the semester the student is in during the period the
 * schedule keeps, or of a special or additional activity that names the
 * student. Null otherwise, and for a student who is not Aktif. `id` comes
 * from outside and is not trusted.
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
  if (!found) return null;
  const { semester, startYear, term, ...schedule } = found;
  const period = { startYear, term };
  const isMeant =
    semester === null
      ? await isChosenFor(db, student, schedule.id, period)
      : isInSemester(student.cohortYear, semester, period);
  if (!isMeant) return null;
  return { ...schedule, startTime: hourAndMinute(schedule.startTime) };
}
