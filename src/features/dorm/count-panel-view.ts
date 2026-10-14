import type { CampusMoment } from "@/academic-periods/campus-clock";
import type { Database } from "@/db/connect";
import type { ActivityRow } from "./activity-row";
import { readParticipants } from "./count-participants";
import { readStoredCount } from "./count-store";
import { type CountPanelView, chosenActivity, hasStarted } from "./count-view";
import { leaveMarksAt } from "./leave-marks";
import { readApprovedLeaves, spanOfHeld } from "./leave-store";

/**
 * "Penghitungan kehadiran" of a day, for an account that may count: the
 * activity it opens on and, once that has started, its participants with
 * the count kept for it and those approved leave covers. Only that
 * activity is read. Null for a day without activities.
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
  const held = { ...activity, day };
  if (!hasStarted(held, now)) {
    return { kind: "not_started", activity };
  }
  const [participants, stored, leaves] = await Promise.all([
    readParticipants(db, activity.audience, day),
    readStoredCount(db, activity.id, day),
    readApprovedLeaves(db, spanOfHeld(held)),
  ]);
  const ids = participants.map((participant) => participant.id);
  const onLeave = leaveMarksAt(leaves, ids, held);
  if (stored === null) {
    return { kind: "open", activity, participants, kept: null, onLeave };
  }
  const { id: _id, ...kept } = stored;
  return { kind: "open", activity, participants, kept, onLeave };
}
