import { Refusal } from "@/db/refusal";
import { runGuardedCommand } from "@/db/run-guarded-command";
import { readCampusEmailEnding } from "@/settings";
import { parseFirstAccount } from "./first-account";
import { replaceHeadOfUnit } from "./replace-head-of-unit";

/** What was typed after the command's own name. */
const FIRST_ARGUMENT = 2;

// Nothing printed here repeats the name or the address that was typed.
runGuardedCommand(async (db) => {
  const person = parseFirstAccount(
    process.argv.slice(FIRST_ARGUMENT),
    readCampusEmailEnding(),
  );
  if (!person.ok) throw new Refusal(person.error);
  const replaced = await replaceHeadOfUnit(db, person.value);
  if (!replaced.ok) throw new Refusal(replaced.error);
  return "The account is now the Kepala Unit, and every other Kepala Unit account stopped being one. Each change has its line in the log of role changes.";
});
