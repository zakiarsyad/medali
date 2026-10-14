import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import { dormActivityDaysOff } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { shownDay } from "@/ui/day";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_NOT_FOUND,
  NO_DAY_PICKED,
  ONLY_ROUTINE_HAS_DAYS_OFF,
} from "./activity-messages";
import { isRoutine } from "./activity-row";
import {
  lockActivity,
  markChanged,
  readCurrentVersion,
  readDaysOff,
} from "./activity-store";
import { daysOffToKeep } from "./days-off-kept";

async function save(
  tx: Database,
  actorId: string,
  id: string,
  day: string,
  today: string,
): Promise<Parsed<string>> {
  const kept = await lockActivity(tx, id);
  if (kept === null) return ACTIVITY_NOT_FOUND;
  const current = await readCurrentVersion(tx, id);
  if (current === null) return ACTIVITY_NOT_FOUND;
  if (!isRoutine(current)) return ONLY_ROUTINE_HAS_DAYS_OFF;
  // The same limit as a save of the form, so the form can always be saved.
  const stored = await readDaysOff(tx, id);
  const allowed = daysOffToKeep(stored, [...stored, day], today);
  if (!allowed.ok) return allowed;

  await tx
    .insert(dormActivityDaysOff)
    .values({ activityId: id, day })
    .onConflictDoNothing();
  await markChanged(tx, id, actorId);
  return {
    ok: true,
    value: `Ditandai tidak ada kegiatan pada ${shownDay(day)}.`,
  };
}

/**
 * "Tiada kegiatan": marks a day on which a repeating activity that is not
 * removed does not take place, and gives back what to tell the staff. A
 * day marked before stays marked once. It counts as a change of the
 * activity, so a form opened before it does not save its older days off
 * over it. At most 100 days off may be today or later, as in the form.
 * `today` is the day on campus.
 */
export async function markDayOff(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  day: string,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_activities")) {
    return ACTIVITIES_NOT_ALLOWED;
  }
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;
  if (!isDay(day)) return NO_DAY_PICKED;
  return db.transaction((tx) => save(tx, actor.id, id, day, today));
}
