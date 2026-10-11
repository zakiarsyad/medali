import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { sikuBaseScore } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { parseBaseScore } from "./base-score-input";
import { NOT_ALLOWED } from "./not-allowed";

/**
 * Saves the SIKU base score over the one kept before, with who set it and
 * when. Gives back the score that was saved.
 */
export async function saveBaseScore(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: string,
): Promise<Parsed<number>> {
  if (!may(actor.roles, "change_curriculum")) return NOT_ALLOWED;
  const parsed = parseBaseScore(sent);
  if (!parsed.ok) return parsed;

  const kept = { score: parsed.value, setAt: new Date(), setBy: actor.id };
  await db
    .insert(sikuBaseScore)
    .values(kept)
    .onConflictDoUpdate({ target: sikuBaseScore.id, set: kept });
  return parsed;
}
