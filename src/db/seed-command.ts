import { currentStage } from "@/settings";
import { rebuildTables } from "./rebuild";
import { runCommand } from "./run-command";
import { fillWithSampleData } from "./seed";

runCommand(async (db) => {
  const stage = currentStage();
  // The previews get their sample data from the deploy step.
  if (stage !== "local") {
    throw new Error(
      `Sample data replaces all data, so it is refused here (${stage}).`,
    );
  }
  await rebuildTables(db);
  await fillWithSampleData(db);
  return "Sample data loaded.";
});
