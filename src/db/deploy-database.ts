import { count, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Stage } from "@/settings";
import {
  forgetStartedCommit,
  noteStartedCommit,
  readStartedCommit,
} from "./deploy-commit";
import {
  checkDeployTarget,
  databaseKindFor,
  deployPlanFor,
  type MainPreviewState,
  type StartOverReason,
  startOverReasonFor,
} from "./deploy-plan";
import { forgetStarts, hasStartMark, noteStart } from "./deploy-start";
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
  "no-start-mark": "it held no mark of a finished start",
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
  // The marks of earlier starts go first and the new one is noted last,
  // so a start that failed anywhere leaves no mark and is tried again by
  // the next deploy.
  await forgetStarts(db);
  await startOver(db);
  await noteStart(db);
  return `Database of main started over with sample data: ${SAID_FOR[reason]}.`;
}

/**
 * The Render preview starts its database over once for each commit it
 * shows, and keeps the data when it only wakes from sleep. The commit is
 * noted last, so a start that failed anywhere is tried again. Without a
 * commit named, every start is a new one.
 */
async function deployRenderPreview(
  db: PostgresJsDatabase,
  commit: string | undefined,
): Promise<string> {
  if (commit && (await readStartedCommit(db)) === commit) {
    return `Render preview database already holds the sample data of commit ${commit}; data kept.`;
  }
  await forgetStartedCommit(db);
  await startOver(db);
  if (!commit) {
    return "Render preview database started over with sample data; Render named no commit.";
  }
  await noteStartedCommit(db, commit);
  return `Render preview database started over with sample data for commit ${commit}.`;
}

/**
 * The database step of a preview: in a Vercel build, or when the Render
 * preview starts, with the commit Render deployed. The checks that guard
 * it run before anything is changed.
 */
export async function deployDatabase(
  db: PostgresJsDatabase,
  stage: Stage,
  branch: string | undefined,
  commit?: string,
): Promise<string> {
  const plan = deployPlanFor(stage, branch);
  const check = checkDeployTarget(plan, await readDeployTarget(db));
  if (check === "mark-and-go") await markDatabase(db, databaseKindFor(plan));

  if (plan === "apply-table-changes") return deployMainPreview(db);
  if (plan === "reset-for-new-commit") return deployRenderPreview(db, commit);
  // Also removes the tables other PRs added.
  await startOver(db);
  return "PR preview database reset to sample data.";
}
