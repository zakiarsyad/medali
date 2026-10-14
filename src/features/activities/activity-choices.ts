import { and, asc, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { ActivityChoice } from "./activity-choice";
import { ofKind } from "./list-schedules";
import type { ScheduleKind } from "./schedule-list-address";

/**
 * The activities of one kind that are in the Kurikulum list: the PPKS
 * ones by semester and then by name, or the special and additional ones,
 * which have no semester, by name.
 */
export async function readActivityChoices(
  db: Database,
  kind: ScheduleKind,
): Promise<ActivityChoice[]> {
  return db
    .select({
      id: ppksActivities.id,
      semester: ppksActivities.semester,
      name: ppksActivities.name,
      valueKeys: ppksActivities.valueKeys,
      indicatorCodes: ppksActivities.indicatorCodes,
      targetParticipants: ppksActivities.targetParticipants,
      isRequired: ppksActivities.isRequired,
    })
    .from(ppksActivities)
    .where(and(isNull(ppksActivities.deletedAt), ofKind(kind)))
    .orderBy(asc(ppksActivities.semester), asc(ppksActivities.name));
}
