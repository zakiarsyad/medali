import { asc, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import {
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import type { ActivityRow } from "./activity-row";

/** Every day off of the activity of a row, the earliest first. */
const DAYS_OFF = sql<string[]>`array(
  select ${dormActivityDaysOff.day}::text
  from ${dormActivityDaysOff}
  where ${dormActivityDaysOff.activityId} = ${dormActivities.id}
  order by ${dormActivityDaysOff.day}
)`;

const ROW = {
  id: dormActivities.id,
  changedAt: dormActivities.changedAt,
  removedFrom: dormActivities.removedFrom,
  shownFrom: dormActivityVersions.shownFrom,
  shownUntil: dormActivityVersions.shownUntil,
  name: dormActivityVersions.name,
  category: dormActivityVersions.category,
  location: dormActivityVersions.location,
  pattern: dormActivityVersions.pattern,
  weekdays: dormActivityVersions.weekdays,
  monthDay: dormActivityVersions.monthDay,
  startsOn: dormActivityVersions.startsOn,
  endsOn: dormActivityVersions.endsOn,
  startTime: dormActivityVersions.startTime,
  endTime: dormActivityVersions.endTime,
  organiser: dormActivityVersions.organiser,
  organiserName: dormActivityVersions.organiserName,
  audience: dormActivityVersions.audience,
  isRequired: dormActivityVersions.isRequired,
  rundown: dormActivityVersions.rundown,
  daysOff: DAYS_OFF,
};

/** The versions that match, each with its activity, still in no order. */
export function selectVersions(db: Database, condition: SQL | undefined) {
  return db
    .select(ROW)
    .from(dormActivityVersions)
    .innerJoin(
      dormActivities,
      eq(dormActivities.id, dormActivityVersions.activityId),
    )
    .where(condition);
}

type StoredRow = Awaited<ReturnType<typeof selectVersions>>[number];

export function rowOf(stored: StoredRow): ActivityRow {
  const { changedAt, ...row } = stored;
  return {
    ...row,
    startTime: hourAndMinute(row.startTime),
    endTime: hourAndMinute(row.endTime),
    version: versionOf(changedAt),
  };
}

/** The versions that match a condition, by first hour and then by name. */
export async function readVersions(
  db: Database,
  condition: SQL | undefined,
): Promise<ActivityRow[]> {
  const rows = await selectVersions(db, condition).orderBy(
    asc(dormActivityVersions.startTime),
    asc(dormActivityVersions.name),
    asc(dormActivityVersions.id),
  );
  return rows.map(rowOf);
}
