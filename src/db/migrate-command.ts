import { applyTableChanges } from "./migrate";
import { runCommand } from "./run-command";

runCommand(async (db) => {
  await applyTableChanges(db);
  return "Table changes applied.";
});
