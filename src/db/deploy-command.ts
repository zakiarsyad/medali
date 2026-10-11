import { count } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { currentStage, deployBranch } from "@/settings";
import {
  checkDeployTarget,
  type DatabaseKind,
  deployPlanFor,
} from "./deploy-plan";
import { markDatabase, readDeployTarget } from "./deploy-target";
import { applyTableChanges } from "./migrate";
import { rebuildTables } from "./rebuild";
import { runCommand } from "./run-command";
import { accounts } from "./schema";
import { fillWithSampleData } from "./seed";

async function hasNoAccounts(db: PostgresJsDatabase): Promise<boolean> {
  const [counted] = await db.select({ total: count() }).from(accounts);
  return (counted?.total ?? 0) === 0;
}

runCommand(async (db) => {
  const plan = deployPlanFor(currentStage(), deployBranch());
  const check = checkDeployTarget(plan, await readDeployTarget(db));
  const kind: DatabaseKind =
    plan === "reset-to-sample-data" ? "pr-preview" : "main-preview";
  if (check === "mark-and-go") await markDatabase(db, kind);

  if (plan === "reset-to-sample-data") {
    // Removes every table, including those other PRs added.
    await rebuildTables(db);
    await fillWithSampleData(db);
    return "PR preview database reset to sample data.";
  }
  await applyTableChanges(db);
  // The first deploy of main finds an empty database; it gets the sample
  // data once, and keeps whatever it holds from then on.
  if (await hasNoAccounts(db)) {
    await fillWithSampleData(db);
    return "Table changes applied, and the empty database filled with sample data.";
  }
  return "Table changes applied; data kept.";
});
