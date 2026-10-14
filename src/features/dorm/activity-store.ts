import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import type { ActivityInput } from "./activity-input";

/*
 * What adding, changing and removing a dorm activity share.
 */

export type StoredVersion = typeof dormActivityVersions.$inferSelect;

/** What a version keeps of a checked activity: all but its days off. */
export function versionParts(input: ActivityInput) {
  const { daysOff: _daysOff, ...parts } = input;
  return parts;
}

/** A stored version as the form would send it, with the days off given. */
export function inputOf(
  version: StoredVersion,
  daysOff: string[],
): ActivityInput {
  return {
    name: version.name,
    category: version.category,
    location: version.location,
    pattern: version.pattern,
    weekdays: version.weekdays,
    monthDay: version.monthDay,
    startsOn: version.startsOn,
    endsOn: version.endsOn,
    daysOff,
    startTime: hourAndMinute(version.startTime),
    endTime: hourAndMinute(version.endTime),
    organiser: version.organiser,
    organiserName: version.organiserName,
    audience: version.audience,
    isRequired: version.isRequired,
    rundown: version.rundown,
  };
}

/** Matches the activity with that id when it is not removed. */
export function keptActivity(id: string): SQL | undefined {
  return and(eq(dormActivities.id, id), isNull(dormActivities.deletedAt));
}

/**
 * Reads an activity that is not removed and holds it until the
 * transaction ends. Every change to an activity starts here, so two of
 * them never run at the same moment: the second waits and then sees
 * what the first one saved.
 */
export async function lockActivity(tx: Database, id: string) {
  const [kept] = await tx
    .select()
    .from(dormActivities)
    .where(keptActivity(id))
    .for("update");
  return kept ?? null;
}

/** The version of an activity without a last day: what it holds now. */
export async function readCurrentVersion(
  tx: Database,
  activityId: string,
): Promise<StoredVersion | null> {
  const [version] = await tx
    .select()
    .from(dormActivityVersions)
    .where(
      and(
        eq(dormActivityVersions.activityId, activityId),
        isNull(dormActivityVersions.shownUntil),
      ),
    );
  return version ?? null;
}

/** Every day off of an activity, the earliest first. */
export async function readDaysOff(
  tx: Database,
  activityId: string,
): Promise<string[]> {
  const kept = await tx
    .select({ day: dormActivityDaysOff.day })
    .from(dormActivityDaysOff)
    .where(eq(dormActivityDaysOff.activityId, activityId))
    .orderBy(dormActivityDaysOff.day);
  return kept.map(({ day }) => day);
}

/** Makes the days off of an activity those given, and only those. */
export async function putDaysOff(
  tx: Database,
  activityId: string,
  daysOff: string[],
): Promise<void> {
  await tx
    .delete(dormActivityDaysOff)
    .where(eq(dormActivityDaysOff.activityId, activityId));
  if (daysOff.length === 0) return;
  await tx
    .insert(dormActivityDaysOff)
    .values(daysOff.map((day) => ({ activityId, day })));
}

/**
 * The moment of a change: now, or one millisecond after the change
 * before it when that one was made within the same millisecond. A version
 * is told by this moment, so no two saved states may share it.
 */
function nextChangedAt(): SQL<Date> {
  const now = new Date().toISOString();
  return sql<Date>`greatest(${now}::timestamptz, ${dormActivities.changedAt} + interval '1 millisecond')`;
}

/** Marks an activity as changed now, by the account given. */
export async function markChanged(
  tx: Database,
  activityId: string,
  actorId: string,
): Promise<void> {
  await tx
    .update(dormActivities)
    .set({ changedAt: nextChangedAt(), changedBy: actorId })
    .where(eq(dormActivities.id, activityId));
}
