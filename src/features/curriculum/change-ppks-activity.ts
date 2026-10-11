import { and, eq, isNull } from "drizzle-orm";
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
 * Changes a PPKS activity that is not removed, with who changed it and
 * when. Its semester stays: one sent for another semester is not found.
 * Gives back the name that was kept.
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
    .where(
      and(
        eq(ppksActivities.id, id),
        eq(ppksActivities.semester, parsed.value.semester),
        isNull(ppksActivities.deletedAt),
      ),
    )
    .returning({ id: ppksActivities.id });
  if (!changed) return ACTIVITY_NOT_FOUND;
  return { ok: true, value: parsed.value.name };
}
