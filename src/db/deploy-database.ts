import { count, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Stage } from "@/settings";
import {
  checkDeployTarget,
  type DatabaseKind,
  deployPlanFor,
  type MainPreviewState,
  type StartOverReason,
  startOverReasonFor,
} from "./deploy-plan";
import { hasStartMark, noteStart } from "./deploy-start";
import { markDatabase, readDeployTarget } from "./deploy-target";
import {
  applyTableChanges,
  countTableChangesApplied,
  countTableChangesInRepo,
} from "./migrate";
import { rebuildTables } from "./rebuild";
import { accounts } from "./schema";
import { fillWithSampleData } from "./seed";

const SAID_FOR: Record<StartOverReason, string> = {
  "new-table-change": "a table change is new",
  "no-account": "it held no account",
  "no-start-mark": "it was never started over before",
};

/** A database with no table yet holds no account either. */
async function holdsAnAccount(db: PostgresJsDatabase): Promise<boolean> {
  const found = await db.execute<{ table: string | null }>(
    sql`select to_regclass('public.accounts')::text as table`,
  );
  if (!found[0]?.table) return false;
  const [counted] = await db.select({ total: count() }).from(accounts);
  return (counted?.total ?? 0) > 0;
}

async function readMainPreviewState(
  db: PostgresJsDatabase,
): Promise<MainPreviewState> {
  return {
    tableChangesApplied: await countTableChangesApplied(db),
    tableChangesInRepo: countTableChangesInRepo(),
    holdsAnAccount: await holdsAnAccount(db),
    hasStartMark: await hasStartMark(db),
  };
}

/** Removes every table, makes them again, and fills them. */
async function startOver(db: PostgresJsDatabase): Promise<void> {
  await rebuildTables(db);
  await fillWithSampleData(db);
}

async function deployMainPreview(db: PostgresJsDatabase): Promise<string> {
  const reason = startOverReasonFor(await readMainPreviewState(db));
  if (reason === null) {
    await applyTableChanges(db);
    return "No table change is new; data kept.";
  }
  // A new table change is not applied on top of the old rows first: they
  // could refuse it, and they are removed anyway.
  await startOver(db);
  // Noted only now, so a start that failed is tried again by the next
  // deploy.
  await noteStart(db);
  return `Database of main started over with sample data: ${SAID_FOR[reason]}.`;
}

/**
 * The database step of a Vercel build. The checks that guard it run
 * before anything is changed.
 */
export async function deployDatabase(
  db: PostgresJsDatabase,
  stage: Stage,
  branch: string | undefined,
): Promise<string> {
  const plan = deployPlanFor(stage, branch);
  const check = checkDeployTarget(plan, await readDeployTarget(db));
  const kind: DatabaseKind =
    plan === "reset-to-sample-data" ? "pr-preview" : "main-preview";
  if (check === "mark-and-go") await markDatabase(db, kind);

  if (plan === "apply-table-changes") return deployMainPreview(db);
  // Also removes the tables other PRs added.
  await startOver(db);
  return "PR preview database reset to sample data.";
}
