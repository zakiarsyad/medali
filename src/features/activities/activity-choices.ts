import { and, asc, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { ValueKey } from "@/ui/medali-values";

/** A PPKS activity of Kurikulum as the schedule form offers it. */
export interface ActivityChoice {
  id: string;
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
}

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

/** The choices of one semester each, in semester order, for the groups. */
export function choicesBySemester(
  choices: readonly ActivityChoice[],
): Map<number, ActivityChoice[]> {
  const semesters = [...new Set(choices.map((choice) => choice.semester))];
  semesters.sort((one, other) => one - other);
  const grouped = new Map<number, ActivityChoice[]>();
  for (const semester of semesters) {
    grouped.set(
      semester,
      choices.filter((choice) => choice.semester === semester),
    );
  }
  return grouped;
}
