import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { proofFileKeeping } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { parseKeepDays } from "./keep-days-input";
import { NOT_ALLOWED } from "./not-allowed";

/**
 * Saves how many days proof files are kept over the number kept before,
 * with who set it and when. Gives back the number that was saved.
 */
export async function saveKeepDays(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: string,
): Promise<Parsed<number>> {
  if (!may(actor.roles, "manage_proof_files")) return NOT_ALLOWED;
  const parsed = parseKeepDays(sent);
  if (!parsed.ok) return parsed;

  const kept = { keepDays: parsed.value, setAt: new Date(), setBy: actor.id };
  await db
    .insert(proofFileKeeping)
    .values(kept)
    .onConflictDoUpdate({ target: proofFileKeeping.id, set: kept });
  return parsed;
}
