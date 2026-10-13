import { Refusal } from "@/db/refusal";
import { runGuardedCommand } from "@/db/run-guarded-command";
import { readCampusEmailEnding } from "@/settings";
import { addFirstAccount } from "./add-first-account";
import { parseFirstAccount } from "./first-account";

/** What was typed after the command's own name. */
const FIRST_ARGUMENT = 2;

// Nothing printed here repeats the name or the address that was typed.
runGuardedCommand(async (db) => {
  const account = parseFirstAccount(
    process.argv.slice(FIRST_ARGUMENT),
    readCampusEmailEnding(),
  );
  if (!account.ok) throw new Refusal(account.error);
  const added = await addFirstAccount(db, account.value);
  if (!added.ok) throw new Refusal(added.error);
  return "The first Kepala Unit account was made, with its line in the log of role changes.";
});
