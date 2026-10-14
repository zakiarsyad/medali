import { asc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import { type PpksActivity, versionOf } from "./ppks-activities";
import { scheduleCounts } from "./schedule-counts";

/**
 * The activities that are not removed, by name: the PPKS ones of every
 * semester, and the special and additional ones, which have no semester.
 * Each comes with how often it is scheduled, read in the same query.
 */
export async function readPpksActivities(
  db: Database,
): Promise<PpksActivity[]> {
  const counts = scheduleCounts(db);
  const kept = await db
    .select({
      id: ppksActivities.id,
      semester: ppksActivities.semester,
      name: ppksActivities.name,
      valueKeys: ppksActivities.valueKeys,
      indicatorCodes: ppksActivities.indicatorCodes,
      targetParticipants: ppksActivities.targetParticipants,
      isRequired: ppksActivities.isRequired,
      description: ppksActivities.description,
      changedAt: ppksActivities.changedAt,
      scheduled: counts.scheduled,
    })
    .from(ppksActivities)
    .leftJoin(counts, eq(counts.activityId, ppksActivities.id))
    .where(isNull(ppksActivities.deletedAt))
    .orderBy(asc(ppksActivities.name));
  return kept.map(({ changedAt, scheduled, ...activity }) => ({
    ...activity,
    version: versionOf(changedAt),
    scheduledCount: scheduled ?? 0,
  }));
}
