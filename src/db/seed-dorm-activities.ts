import { randomUUID } from "node:crypto";
import type { Database } from "./connect";
import { sampleDormActivities } from "./sample-dorm-activities";
import {
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "./schema";

/**
 * Adds the sample dorm activities around a day, with their versions and
 * their days off, as the work of one account. `day` is today on campus.
 */
export async function addSampleDormActivities(
  db: Database,
  day: string,
  by: string,
): Promise<void> {
  const added = sampleDormActivities(day).map((sample) => ({
    id: randomUUID(),
    sample,
  }));
  if (added.length === 0) return;
  const changed = { changedAt: new Date(), changedBy: by };

  await db
    .insert(dormActivities)
    .values(added.map(({ id }) => ({ id, ...changed })));
  await db
    .insert(dormActivityVersions)
    .values(
      added.flatMap(({ id, sample }) =>
        sample.versions.map((version) => ({ ...version, activityId: id })),
      ),
    );
  const daysOff = added.flatMap(({ id, sample }) =>
    sample.daysOff.map((dayOff) => ({ activityId: id, day: dayOff })),
  );
  if (daysOff.length > 0) await db.insert(dormActivityDaysOff).values(daysOff);
}
