import type { CampusMoment } from "@/academic-periods/campus-clock";
import type { Database } from "@/db/connect";
import type { ActivityRow } from "./activity-row";
import { readParticipants } from "./count-participants";
import { readStoredCount } from "./count-store";
import { type CountPanelView, chosenActivity, hasStarted } from "./count-view";

/**
 * "Penghitungan kehadiran" of a day, for an account that may count: the
 * activity it opens on and, once that has started, its participants with
 * the count kept for it. Only that activity is read. Null for a day
 * without activities.
 */
export async function loadCountPanel(
  db: Database,
  activities: ActivityRow[],
  day: string,
  wantedId: string | null,
  now: CampusMoment,
): Promise<CountPanelView | null> {
  const activity = chosenActivity(activities, wantedId, day, now);
  if (activity === null) return null;
  if (!hasStarted({ ...activity, day }, now)) {
    return { kind: "not_started", activity };
  }
  const [participants, stored] = await Promise.all([
    readParticipants(db, activity.audience, day),
    readStoredCount(db, activity.id, day),
  ]);
  if (stored === null) {
    return { kind: "open", activity, participants, kept: null };
  }
  const { id: _id, ...kept } = stored;
  return { kind: "open", activity, participants, kept };
}
