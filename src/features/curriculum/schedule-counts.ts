import { isNull, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activitySchedules } from "@/db/schema";

/** A schedule that counts: one not removed, of any period. */
export const COUNTED_SCHEDULE = isNull(activitySchedules.deletedAt);

/**
 * How many schedules each activity has, worked out for every activity at
 * once. An activity with none has no row.
 */
export function scheduleCounts(db: Database) {
  return db
    .select({
      activityId: activitySchedules.activityId,
      scheduled: sql<number>`cast(count(*) as int)`.as("scheduled"),
    })
    .from(activitySchedules)
    .where(COUNTED_SCHEDULE)
    .groupBy(activitySchedules.activityId)
    .as("schedule_counts");
}
