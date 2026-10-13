import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import { momentOf } from "./ppks-activities";
import {
  type PpksActivityInput,
  parsePpksActivity,
  type SentPpksActivity,
} from "./ppks-activity-input";

export const ACTIVITY_NOT_FOUND = {
  ok: false,
  error: "Kegiatan tidak ditemukan.",
} as const;

/** What a change answers when the activity was changed after its form opened. */
export const ACTIVITY_CHANGED_BY_OTHER = {
  ok: false,
  error:
    "Kegiatan ini baru saja diubah orang lain. Muat ulang untuk melihat versi terbaru.",
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
 * The moment of a change: now, or one millisecond after the change
 * before it when that one was made within the same millisecond. A version
 * is told by this moment, so no two saved states may share it.
 */
function nextChangedAt(): SQL<Date> {
  const now = new Date().toISOString();
  return sql<Date>`greatest(${now}::timestamptz, ${ppksActivities.changedAt} + interval '1 millisecond')`;
}

/**
 * Changes the activity when it is still as the form was opened with.
 * Two changes of one version never both go in: the second waits for the
 * first, then finds the version gone.
 */
async function changeOpened(
  db: Database,
  actorId: string,
  kept: SQL | undefined,
  openedAt: Date,
  input: PpksActivityInput,
): Promise<boolean> {
  const changed = await db
    .update(ppksActivities)
    .set({ ...input, changedAt: nextChangedAt(), changedBy: actorId })
    .where(and(kept, eq(ppksActivities.changedAt, openedAt)))
    .returning({ id: ppksActivities.id });
  return changed.length > 0;
}

/**
 * Changes an activity that is not removed, with who changed it and when.
 * Its kind and its semester stay: one sent for another semester, or as
 * the other kind, is not found. `version` is the one the form was opened
 * with: when the activity was changed since, by someone else or by the
 * same form sent before, the change is refused and nothing is
 * overwritten. Gives back the name that was kept.
 */
export async function changePpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  version: string,
  sent: SentPpksActivity,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  const parsed = parsePpksActivity(sent);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const kept = keptOfKind(id, parsed.value.semester);
  const openedAt = momentOf(version);
  const isChanged =
    openedAt !== null &&
    (await changeOpened(db, actor.id, kept, openedAt, parsed.value));
  if (isChanged) return { ok: true, value: parsed.value.name };

  const [still] = await db
    .select({ id: ppksActivities.id })
    .from(ppksActivities)
    .where(kept);
  return still ? ACTIVITY_CHANGED_BY_OTHER : ACTIVITY_NOT_FOUND;
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
