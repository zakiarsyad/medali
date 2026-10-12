import { currentStage } from "@/settings";
import { readDeployTarget } from "./deploy-target";
import { rebuildTables } from "./rebuild";
import { runCommand } from "./run-command";
import { fillWithSampleData } from "./seed";
import { checkSeedStage, checkSeedTarget } from "./seed-plan";

runCommand(async (db) => {
  checkSeedStage(currentStage());
  const target = await readDeployTarget(db);
  checkSeedTarget(target.marker);
  await rebuildTables(db);
  await fillWithSampleData(db);
  return "Sample data loaded.";
});
