import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  isNull,
  type SQL,
} from "drizzle-orm";
import { levelOf } from "@/academic-periods/stages";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { ScheduleRow } from "./schedule-row";
import { hourAndMinute } from "./stored-time";

/** One page of the list, and how many schedules the list has in all. */
export interface ScheduleList {
  schedules: ScheduleRow[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const ROW = {
  id: activitySchedules.id,
  startsOn: activitySchedules.startsOn,
  endsOn: activitySchedules.endsOn,
  startTime: activitySchedules.startTime,
  endTime: activitySchedules.endTime,
  uploadCount: activitySchedules.uploadCount,
  uploadUnit: activitySchedules.uploadUnit,
  location: activitySchedules.location,
  isRequired: activitySchedules.isRequired,
  name: ppksActivities.name,
  semester: ppksActivities.semester,
  indicatorCodes: ppksActivities.indicatorCodes,
  targetParticipants: ppksActivities.targetParticipants,
  startYear: academicPeriods.startYear,
  term: academicPeriods.term,
};

/** The activities of a tahap: those of its two semesters. */
function ofLevel(level: number | null): SQL | undefined {
  if (level === null) return undefined;
  const semesters = SEMESTERS.filter((semester) => levelOf(semester) === level);
  return inArray(ppksActivities.semester, semesters);
}

/**
 * The schedules of PPKS activities that are not removed, of a tahap or of
 * every tahap. An activity that was removed from Kurikulum since still
 * counts: its schedules stay.
 */
function found(level: number | null): SQL | undefined {
  return and(
    isNull(activitySchedules.deletedAt),
    isNotNull(ppksActivities.semester),
    ofLevel(level),
  );
}

const OF_SCHEDULE = eq(ppksActivities.id, activitySchedules.activityId);

async function countSchedules(
  db: Database,
  condition: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(condition);
  return counted?.matching ?? 0;
}

/** The earliest first; two that start together keep one order on every page. */
function readRows(db: Database, condition: SQL | undefined, page: number) {
  return db
    .select(ROW)
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, activitySchedules.academicPeriodId),
    )
    .where(condition)
    .orderBy(
      asc(activitySchedules.startsOn),
      asc(activitySchedules.startTime),
      asc(activitySchedules.id),
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

type StoredRow = Awaited<ReturnType<typeof readRows>>[number];

function rowOf(stored: StoredRow): ScheduleRow {
  const { name, semester, indicatorCodes, targetParticipants, ...rest } =
    stored;
  const { startYear, term, ...schedule } = rest;
  // The read asks for PPKS activities only, and each has a semester.
  if (semester === null) {
    throw new Error(`The schedule ${stored.id} is of no PPKS activity.`);
  }
  return {
    ...schedule,
    startTime: hourAndMinute(schedule.startTime),
    endTime: hourAndMinute(schedule.endTime),
    activity: { name, semester, indicatorCodes, targetParticipants },
    period: { startYear, term },
  };
}

/**
 * One page of the schedules, the earliest first, of one tahap or of every
 * tahap when `level` is null. Each comes with its activity as Kurikulum
 * has it now, and with the academic period it keeps.
 */
export async function listSchedules(
  db: Database,
  level: number | null,
  page: number,
): Promise<ScheduleList> {
  const condition = found(level);
  const matching = await countSchedules(db, condition);
  const shownPage = pageWithin(page, matching);
  const rows = await readRows(db, condition, shownPage);
  return { schedules: rows.map(rowOf), matching, page: shownPage };
}
