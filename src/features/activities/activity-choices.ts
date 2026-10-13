import { and, asc, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { ActivityChoice } from "./activity-choice";

/**
 * The PPKS activities that are in the Kurikulum list, by semester and
 * then by name. The special and additional ones, which have no semester,
 * are not PPKS and are left out.
 */
export async function readActivityChoices(
  db: Database,
): Promise<ActivityChoice[]> {
  const kept = await db
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
    .where(
      and(isNull(ppksActivities.deletedAt), isNotNull(ppksActivities.semester)),
    )
    .orderBy(asc(ppksActivities.semester), asc(ppksActivities.name));
  const choices: ActivityChoice[] = [];
  for (const { semester, ...activity } of kept) {
    if (semester !== null) choices.push({ ...activity, semester });
  }
  return choices;
}
