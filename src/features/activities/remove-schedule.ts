import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activitySchedules } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { keptSchedule, SCHEDULE_NOT_FOUND } from "./change-schedule";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";

/**
 * Marks a schedule as removed, with who removed it and when. Nothing is
 * erased, so attendance that was sent for it can still refer to it. It
 * asks for no version: a schedule someone else changed since the form
 * opened is removed all the same.
 */
export async function removeSchedule(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "manage_activities")) return SCHEDULES_NOT_ALLOWED;
  if (!isUuid(id)) return SCHEDULE_NOT_FOUND;

  const [removed] = await db
    .update(activitySchedules)
    .set({ deletedAt: new Date(), deletedBy: actor.id })
    .where(keptSchedule(id))
    .returning({ id: activitySchedules.id });
  if (!removed) return SCHEDULE_NOT_FOUND;
  return { ok: true, value: null };
}
