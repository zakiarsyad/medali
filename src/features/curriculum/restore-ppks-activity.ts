import { and, eq, isNotNull } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITY_NOT_FOUND } from "./change-ppks-activity";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";

/**
 * "Urungkan": brings a removed activity back to its list as it was, by
 * taking its mark away. Only the account that removed it brings it back
 * this way: one removed by someone else is not found.
 */
export async function restorePpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;

  const [restored] = await db
    .update(ppksActivities)
    .set({ deletedAt: null, deletedBy: null })
    .where(
      and(
        eq(ppksActivities.id, id),
        isNotNull(ppksActivities.deletedAt),
        eq(ppksActivities.deletedBy, actor.id),
      ),
    )
    .returning({ id: ppksActivities.id });
  if (!restored) return ACTIVITY_NOT_FOUND;
  return { ok: true, value: null };
}
