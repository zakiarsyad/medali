import { and, eq, gt, gte, isNull, lte, or, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormActivities, dormActivityVersions } from "@/db/schema";
import { takingPlaceOn } from "./activity-days";
import { readVersions } from "./activity-reads";
import type { ActivityRow } from "./activity-row";

/** The versions shown for a day: the day is within their first and last. */
function shownOn(day: string): SQL | undefined {
  return and(
    or(
      isNull(dormActivityVersions.shownFrom),
      lte(dormActivityVersions.shownFrom, day),
    ),
    or(
      isNull(dormActivityVersions.shownUntil),
      gte(dormActivityVersions.shownUntil, day),
    ),
  );
}

/** The versions whose Berlaku mulai and Berlaku sampai hold the day. */
function validOn(day: string): SQL | undefined {
  return and(
    lte(dormActivityVersions.startsOn, day),
    or(
      isNull(dormActivityVersions.endsOn),
      gte(dormActivityVersions.endsOn, day),
    ),
  );
}

/** The activities not removed, or removed only from a later day on. */
function keptOn(day: string): SQL | undefined {
  return or(
    isNull(dormActivities.removedFrom),
    gt(dormActivities.removedFrom, day),
  );
}

/**
 * The dorm activities of one day, by their first hour: Jadwal harian. The
 * database gives the versions that can take place on the day, and the
 * rule of `takesPlaceOn` decides which of them do. A day gone by shows
 * each activity as the version of that day held it, also one that was
 * removed since.
 */
export async function readDailyActivities(
  db: Database,
  day: string,
): Promise<ActivityRow[]> {
  const rows = await readVersions(
    db,
    and(shownOn(day), validOn(day), keptOn(day)),
  );
  return takingPlaceOn(rows, day);
}

/**
 * One activity as Jadwal harian shows it on a day, or null when it does
 * not take place on that day.
 */
export async function readActivityOn(
  db: Database,
  activityId: string,
  day: string,
): Promise<ActivityRow | null> {
  const rows = await readVersions(
    db,
    and(
      eq(dormActivityVersions.activityId, activityId),
      shownOn(day),
      validOn(day),
      keptOn(day),
    ),
  );
  const [held] = takingPlaceOn(rows, day);
  return held ?? null;
}
