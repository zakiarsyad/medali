import { randomUUID } from "node:crypto";
import { isNotNull } from "drizzle-orm";
import type { Database } from "./connect";
import {
  type SampleActivitySchedule,
  sampleActivitySchedules,
} from "./sample-activity-schedules";
import type { SamplePeriod } from "./sample-data";
import { activitySchedules, ppksActivities } from "./schema";
import { periodIdOf } from "./seed-mentoring-meetings";

/** The ids of the stored PPKS activities, by name. */
async function activityIdsByName(db: Database): Promise<Map<string, string>> {
  const stored = await db
    .select({ id: ppksActivities.id, name: ppksActivities.name })
    .from(ppksActivities)
    .where(isNotNull(ppksActivities.semester));
  return new Map(stored.map((activity) => [activity.name, activity.id]));
}

async function periodIdsOf(
  db: Database,
  periods: SamplePeriod[],
): Promise<Map<SamplePeriod, string>> {
  const ids = new Map<SamplePeriod, string>();
  for (const period of periods) {
    ids.set(period, await periodIdOf(db, period));
  }
  return ids;
}

function idOf<Key>(ids: Map<Key, string>, key: Key, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample schedule names a ${what} that is missing.`);
  }
  return id;
}

/** A sample schedule with the key it was stored under. */
export interface AddedSchedule {
  id: string;
  sample: SampleActivitySchedule;
}

/**
 * Adds the sample schedules around a day, as the work of one account, and
 * gives them back with their keys. The sample PPKS activities and the
 * sample periods must be there already. `day` is today on campus.
 */
export async function addSampleActivitySchedules(
  db: Database,
  periods: SamplePeriod[],
  day: string,
  by: string,
): Promise<AddedSchedule[]> {
  const samples = sampleActivitySchedules(day, periods);
  if (samples.length === 0) return [];
  const activityIds = await activityIdsByName(db);
  const periodIds = await periodIdsOf(db, periods);
  const changed = { changedAt: new Date(), changedBy: by };
  const added = samples.map((sample) => ({ id: randomUUID(), sample }));

  await db.insert(activitySchedules).values(
    added.map(({ id, sample: { activityName, period, ...schedule } }) => ({
      ...schedule,
      ...changed,
      id,
      activityId: idOf(activityIds, activityName, "PPKS activity"),
      academicPeriodId: idOf(periodIds, period, "period"),
    })),
  );
  return added;
}
