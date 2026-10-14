import { and, eq, isNotNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_NOT_FOUND,
  ONE_OFF_IS_PAST,
} from "./activity-messages";
import { isRoutine } from "./activity-row";
import { lockActivity, readCurrentVersion } from "./activity-store";

async function mark(
  tx: Database,
  actorId: string,
  id: string,
  today: string,
): Promise<Parsed<null>> {
  const kept = await lockActivity(tx, id);
  if (kept === null) return ACTIVITY_NOT_FOUND;
  const current = await readCurrentVersion(tx, id);
  if (current === null) return ACTIVITY_NOT_FOUND;
  if (!isRoutine(current) && current.startsOn < today) return ONE_OFF_IS_PAST;

  await tx
    .update(dormActivities)
    .set({ removedFrom: today, deletedAt: new Date(), deletedBy: actorId })
    .where(eq(dormActivities.id, id));
  return { ok: true, value: null };
}

/**
 * "Hapus kegiatan": marks an activity as removed, with who removed it,
 * when, and today as the first day it no longer takes place. Nothing is
 * erased, and the days before today still show it as they did. A one-off
 * activity of a day gone by stays as it was held. It asks for no version:
 * an activity someone else changed since the form opened is removed all
 * the same. `today` is the day on campus.
 */
export async function removeActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  today = campusDay(),
): Promise<Parsed<null>> {
  if (!may(actor.roles, "manage_dorm_activities")) {
    return ACTIVITIES_NOT_ALLOWED;
  }
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;
  return db.transaction((tx) => mark(tx, actor.id, id, today));
}

/**
 * "Urungkan": brings a removed activity back as it was, by taking its
 * mark away. Only the account that removed it brings it back this way:
 * one removed by someone else is not found.
 */
export async function restoreActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "manage_dorm_activities")) {
    return ACTIVITIES_NOT_ALLOWED;
  }
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const [restored] = await db
    .update(dormActivities)
    .set({ removedFrom: null, deletedAt: null, deletedBy: null })
    .where(
      and(
        eq(dormActivities.id, id),
        isNotNull(dormActivities.deletedAt),
        eq(dormActivities.deletedBy, actor.id),
      ),
    )
    .returning({ id: dormActivities.id });
  if (!restored) return ACTIVITY_NOT_FOUND;
  return { ok: true, value: null };
}
