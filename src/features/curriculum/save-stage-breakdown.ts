import { sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { stageBreakdowns } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { parseBreakdown, type SentBreakdown } from "./breakdown-input";
import { NOT_ALLOWED } from "./not-allowed";

/**
 * Saves the breakdown of one nilai at one tahap over the one kept before,
 * with who changed it and when. Gives back the name of the nilai.
 */
export async function saveStageBreakdown(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: SentBreakdown,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "change_curriculum")) return NOT_ALLOWED;
  const parsed = parseBreakdown(sent);
  if (!parsed.ok) return parsed;

  await db
    .insert(stageBreakdowns)
    .values({ ...parsed.value, changedAt: new Date(), changedBy: actor.id })
    .onConflictDoUpdate({
      target: [stageBreakdowns.tahap, stageBreakdowns.valueKey],
      set: {
        text: sql`excluded.text`,
        activities: sql`excluded.activities`,
        indicatorCodes: sql`excluded.indicator_codes`,
        changedAt: sql`excluded.changed_at`,
        changedBy: sql`excluded.changed_by`,
      },
    });
  const value = MEDALI_VALUES.find(({ key }) => key === parsed.value.valueKey);
  return { ok: true, value: value?.name ?? "" };
}
