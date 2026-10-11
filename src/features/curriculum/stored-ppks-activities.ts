import { asc, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { PpksActivity } from "./ppks-activities";

/** The PPKS activities of every semester that are not removed, by name. */
export async function readPpksActivities(
  db: Database,
): Promise<PpksActivity[]> {
  return db
    .select({
      id: ppksActivities.id,
      semester: ppksActivities.semester,
      name: ppksActivities.name,
      valueKeys: ppksActivities.valueKeys,
      indicatorCodes: ppksActivities.indicatorCodes,
      targetParticipants: ppksActivities.targetParticipants,
      isRequired: ppksActivities.isRequired,
      description: ppksActivities.description,
    })
    .from(ppksActivities)
    .where(isNull(ppksActivities.deletedAt))
    .orderBy(asc(ppksActivities.name));
}
