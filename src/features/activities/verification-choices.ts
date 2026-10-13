import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { shownDay } from "@/ui/day";
import { IS_CARD, OF_ATTENDANCE } from "./verification-cards";

/** A schedule the cards can be narrowed to, as the list names it. */
export interface ScheduleChoice {
  id: string;
  /** Its first day, its name and its semester. */
  words: string;
}

export function choiceWords(
  startsOn: string,
  name: string,
  semester: number | null,
): string {
  const named = `${shownDay(startsOn)} · ${name}`;
  return semester === null ? named : `${named} (Semester ${semester})`;
}

/** The schedules that have at least one card, the newest first. */
export async function readScheduleChoices(
  db: Database,
): Promise<ScheduleChoice[]> {
  const schedules = await db
    .selectDistinct({
      id: activitySchedules.id,
      startsOn: activitySchedules.startsOn,
      name: ppksActivities.name,
      semester: ppksActivities.semester,
    })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(
      ppksActivities,
      eq(ppksActivities.id, activitySchedules.activityId),
    )
    .where(IS_CARD)
    .orderBy(desc(activitySchedules.startsOn), desc(activitySchedules.id));
  return schedules.map(({ id, startsOn, name, semester }) => ({
    id,
    words: choiceWords(startsOn, name, semester),
  }));
}
