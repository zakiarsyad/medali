import { eq } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { NO_ACTIVITY, type ScheduleInput } from "./schedule-input";

/** What is said for a first day on which no academic period runs yet. */
export const BEFORE_FIRST_PERIOD = {
  ok: false,
  error:
    "Tanggal mulai lebih awal dari periode akademik pertama, jadi belum ada periode yang berjalan pada tanggal itu. Pilih tanggal mulai yang lebih baru.",
} as const;

/** The activity a saved schedule holds, as the message of the save names it. */
export interface SavedSchedule {
  name: string;
  semester: number;
}

/** Where a checked schedule belongs: its activity and its academic period. */
export interface SchedulePlace {
  activity: SavedSchedule;
  academicPeriodId: string;
}

/**
 * The PPKS activity a schedule names, when it may be scheduled: one that
 * is still in the Kurikulum list. `keptActivityId` is the activity the
 * schedule already holds when it is changed: that one stays allowed after
 * it was removed from the list.
 */
async function activityOf(
  db: Database,
  activityId: string,
  keptActivityId: string | null,
): Promise<SavedSchedule | null> {
  const [activity] = await db
    .select({
      name: ppksActivities.name,
      semester: ppksActivities.semester,
      deletedAt: ppksActivities.deletedAt,
    })
    .from(ppksActivities)
    .where(eq(ppksActivities.id, activityId));
  // A special or additional activity has no semester and is not PPKS.
  if (!activity || activity.semester === null) return null;
  const isInList = activity.deletedAt === null;
  if (!isInList && activityId !== keptActivityId) return null;
  return { name: activity.name, semester: activity.semester };
}

/**
 * Finds the activity of a checked schedule and the academic period that
 * runs on its first day: the one that day falls in, or the one that ended
 * last before it. A day before the first stored period has none and is
 * refused.
 */
export async function placeOf(
  db: Database,
  input: ScheduleInput,
  keptActivityId: string | null,
): Promise<Parsed<SchedulePlace>> {
  const activity = await activityOf(db, input.activityId, keptActivityId);
  if (activity === null) return NO_ACTIVITY;
  const period = await readRunningPeriod(db, input.startsOn);
  if (period === null) return BEFORE_FIRST_PERIOD;
  return { ok: true, value: { activity, academicPeriodId: period.id } };
}
