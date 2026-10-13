import { faultCodeOf, Refusal } from "@/db/refusal";
import { runGuardedCommand } from "@/db/run-guarded-command";
import { readCampusEmailEnding } from "@/settings";
import { addFirstAccount } from "./add-first-account";
import { parseFirstAccount } from "./first-account";

/** What was typed after the command's own name. */
const FIRST_ARGUMENT = 2;

/**
 * Shows a fault of the database by its code only: the database's own
 * words for a failed write repeat the name and the address.
 */
function refuseWithoutWhatWasTyped(fault: unknown): never {
  const code = faultCodeOf(fault) ?? "unknown";
  throw new Refusal(
    `The account was not made: the database, or the way to it, failed (code ${code}). Nothing was changed.`,
  );
}

// Nothing printed here repeats the name or the address that was typed.
runGuardedCommand(async (db) => {
  const account = parseFirstAccount(
    process.argv.slice(FIRST_ARGUMENT),
    readCampusEmailEnding(),
  );
  if (!account.ok) throw new Refusal(account.error);
  const added = await addFirstAccount(db, account.value).catch(
    refuseWithoutWhatWasTyped,
  );
  if (!added.ok) throw new Refusal(added.error);
  return "The first Kepala Unit account was made, with its line in the log of role changes.";
});
