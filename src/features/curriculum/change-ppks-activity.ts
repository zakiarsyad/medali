import { and, eq, isNull, type SQL } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import {
  parsePpksActivity,
  type SentPpksActivity,
} from "./ppks-activity-input";

export const ACTIVITY_NOT_FOUND = {
  ok: false,
  error: "Kegiatan tidak ditemukan.",
} as const;

/**
 * Matches the activity with that id when it is not removed and of the
 * same kind: a PPKS one of that semester, or a special or additional one
 * when there is no semester.
 */
function keptOfKind(id: string, semester: number | null): SQL | undefined {
  const sameKind =
    semester === null
      ? isNull(ppksActivities.semester)
      : eq(ppksActivities.semester, semester);
  return and(
    eq(ppksActivities.id, id),
    sameKind,
    isNull(ppksActivities.deletedAt),
  );
}

/**
 * Changes an activity that is not removed, with who changed it and when.
 * Its kind and its semester stay: one sent for another semester, or as
 * the other kind, is not found. Gives back the name that was kept.
 */
export async function changePpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  sent: SentPpksActivity,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  const parsed = parsePpksActivity(sent);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const [changed] = await db
    .update(ppksActivities)
    .set({ ...parsed.value, changedAt: new Date(), changedBy: actor.id })
    .where(keptOfKind(id, parsed.value.semester))
    .returning({ id: ppksActivities.id });
  if (!changed) return ACTIVITY_NOT_FOUND;
  return { ok: true, value: parsed.value.name };
}

/**
 * Marks an activity as removed, with who removed it and when. Nothing
 * is erased, so a schedule made from it can still refer to it.
 */
export async function removePpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const [removed] = await db
    .update(ppksActivities)
    .set({ deletedAt: new Date(), deletedBy: actor.id })
    .where(and(eq(ppksActivities.id, id), isNull(ppksActivities.deletedAt)))
    .returning({ id: ppksActivities.id });
  if (!removed) return ACTIVITY_NOT_FOUND;
  return { ok: true, value: null };
}
