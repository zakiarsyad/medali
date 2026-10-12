import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Stage } from "@/settings";
import { readDeployTarget } from "./deploy-target";
import { rebuildTables } from "./rebuild";
import { fillWithSampleData } from "./seed";
import { checkSeedStage, checkSeedTarget } from "./seed-plan";

/**
 * What the sample data command does, in order. Both checks come before
 * the tables are made again, so a refusal leaves the database as it was.
 */
export async function loadSampleData(
  db: PostgresJsDatabase,
  stage: Stage,
): Promise<string> {
  checkSeedStage(stage);
  const target = await readDeployTarget(db);
  checkSeedTarget(target.marker);
  await rebuildTables(db);
  await fillWithSampleData(db);
  return "Sample data loaded.";
}
