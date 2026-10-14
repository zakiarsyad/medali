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
import { versionOf } from "@/db/row-version";
import {
  academicPeriods,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import { type ParticipantChoice, shownChoiceOf } from "./chosen-participants";
import { readParticipantChoices, takingPartIn } from "./chosen-students";
import type { ScheduleKind, ScheduleScope } from "./schedule-list-address";
import type { ScheduleRow, ScheduleTarget } from "./schedule-row";

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
  changedAt: activitySchedules.changedAt,
  semester: ppksActivities.semester,
  activity: {
    id: ppksActivities.id,
    name: ppksActivities.name,
    valueKeys: ppksActivities.valueKeys,
    indicatorCodes: ppksActivities.indicatorCodes,
    targetParticipants: ppksActivities.targetParticipants,
    isRequired: ppksActivities.isRequired,
  },
  period: {
    startYear: academicPeriods.startYear,
    term: academicPeriods.term,
  },
};

/** The activities of a tahap: those of its two semesters. */
function ofLevel(level: number | null): SQL | undefined {
  if (level === null) return undefined;
  const semesters = SEMESTERS.filter((semester) => levelOf(semester) === level);
  return inArray(ppksActivities.semester, semesters);
}

/**
 * The activities of a kind: a PPKS one has a semester, and a special or
 * additional one has none.
 */
export function ofKind(kind: ScheduleKind): SQL {
  const { semester } = ppksActivities;
  return kind === "ppks" ? isNotNull(semester) : isNull(semester);
}

/**
 * The schedules of a scope that are not removed. An activity that was
 * removed from Kurikulum since still counts: its schedules stay.
 */
export function listedSchedules(scope: ScheduleScope): SQL | undefined {
  return and(
    isNull(activitySchedules.deletedAt),
    ofKind(scope.kind),
    scope.kind === "ppks" ? ofLevel(scope.level) : undefined,
  );
}

export const OF_SCHEDULE = eq(ppksActivities.id, activitySchedules.activityId);

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

/** Who takes part in each schedule of an extra activity, read for one page. */
interface ChosenOnPage {
  choices: Map<string, ParticipantChoice>;
  /** The Aktif students each one holds, by the key of the schedule. */
  heads: Map<string, number>;
}

/**
 * How many Aktif students take part in each of some schedules of extra
 * activities, counted in the database: only numbers leave it.
 */
async function countHeads(
  db: Database,
  scheduleIds: string[],
): Promise<Map<string, number>> {
  const counted = await db
    .select({ scheduleId: activitySchedules.id, heads: count() })
    .from(activitySchedules)
    .innerJoin(students, takingPartIn(activitySchedules.id))
    .where(inArray(activitySchedules.id, scheduleIds))
    .groupBy(activitySchedules.id);
  return new Map(counted.map(({ scheduleId, heads }) => [scheduleId, heads]));
}

async function readChosen(
  db: Database,
  rows: StoredRow[],
): Promise<ChosenOnPage> {
  const extraIds = rows
    .filter((row) => row.semester === null)
    .map((row) => row.id);
  if (extraIds.length === 0) return { choices: new Map(), heads: new Map() };
  const [choices, heads] = await Promise.all([
    readParticipantChoices(db, extraIds),
    countHeads(db, extraIds),
  ]);
  return { choices, heads };
}

function targetOf(stored: StoredRow, chosen: ChosenOnPage): ScheduleTarget {
  if (stored.semester !== null) {
    return { kind: "semester", semester: stored.semester };
  }
  const choice = chosen.choices.get(stored.id);
  if (choice === undefined) {
    throw new Error(`The schedule ${stored.id} has no participant choice.`);
  }
  return {
    kind: "chosen",
    choice: shownChoiceOf(choice),
    participants: chosen.heads.get(stored.id) ?? 0,
  };
}

function rowOf(stored: StoredRow, chosen: ChosenOnPage): ScheduleRow {
  const { changedAt, semester, ...schedule } = stored;
  return {
    ...schedule,
    startTime: hourAndMinute(schedule.startTime),
    endTime: hourAndMinute(schedule.endTime),
    target: targetOf(stored, chosen),
    version: versionOf(changedAt),
  };
}

/**
 * One page of the schedules of a scope, the earliest first. Each comes
 * with its activity as Kurikulum has it now, whom it is for, and the
 * academic period it keeps.
 */
export async function listSchedules(
  db: Database,
  scope: ScheduleScope,
  page: number,
): Promise<ScheduleList> {
  const condition = listedSchedules(scope);
  const matching = await countSchedules(db, condition);
  const shownPage = pageWithin(page, matching);
  const rows = await readRows(db, condition, shownPage);
  const chosen = await readChosen(db, rows);
  return {
    schedules: rows.map((row) => rowOf(row, chosen)),
    matching,
    page: shownPage,
  };
}
