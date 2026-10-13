import { asc, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import { type PpksActivity, versionOf } from "./ppks-activities";

/**
 * The activities that are not removed, by name: the PPKS ones of every
 * semester, and the special and additional ones, which have no semester.
 */
export async function readPpksActivities(
  db: Database,
): Promise<PpksActivity[]> {
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
    })
    .from(ppksActivities)
    .where(isNull(ppksActivities.deletedAt))
    .orderBy(asc(ppksActivities.name));
  return kept.map(({ changedAt, ...activity }) => ({
    ...activity,
    version: versionOf(changedAt),
  }));
}
