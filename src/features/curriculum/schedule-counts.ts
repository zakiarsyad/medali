import { and, count, eq, isNull, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activitySchedules } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITY_NOT_FOUND } from "./change-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";

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

/**
 * How many schedules one activity has right now, for the warning before
 * it is removed. Only a role that may remove it may ask.
 */
export async function readScheduleCount(
  db: Database,
  actor: Pick<Account, "roles">,
  id: string,
): Promise<Parsed<number>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const [counted] = await db
    .select({ scheduled: count() })
    .from(activitySchedules)
    .where(and(eq(activitySchedules.activityId, id), COUNTED_SCHEDULE));
  return { ok: true, value: counted?.scheduled ?? 0 };
}
