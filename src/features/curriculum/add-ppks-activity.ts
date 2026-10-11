import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import {
  parsePpksActivity,
  type SentPpksActivity,
} from "./ppks-activity-input";

/**
 * Adds a PPKS activity to its semester, with who added it and when. Gives
 * back the name that was kept.
 */
export async function addPpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: SentPpksActivity,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  const parsed = parsePpksActivity(sent);
  if (!parsed.ok) return parsed;

  await db
    .insert(ppksActivities)
    .values({ ...parsed.value, changedAt: new Date(), changedBy: actor.id });
  return { ok: true, value: parsed.value.name };
}
