import { sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { mainIndicators } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { parseIndicatorTexts } from "./indicator-input";
import { NOT_ALLOWED } from "./not-allowed";

/**
 * Saves the texts of all main indicators over the ones kept before, with
 * who changed them and when. `sent` gives the text sent for a code.
 */
export async function saveMainIndicators(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: (code: string) => string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "change_curriculum")) return NOT_ALLOWED;
  const parsed = parseIndicatorTexts(sent);
  if (!parsed.ok) return parsed;

  const changedAt = new Date();
  await db
    .insert(mainIndicators)
    .values(
      parsed.value.map((indicator) => ({
        ...indicator,
        changedAt,
        changedBy: actor.id,
      })),
    )
    .onConflictDoUpdate({
      target: mainIndicators.code,
      set: {
        text: sql`excluded.text`,
        changedAt: sql`excluded.changed_at`,
        changedBy: sql`excluded.changed_by`,
      },
    });
  return { ok: true, value: null };
}
