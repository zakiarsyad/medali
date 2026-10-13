import type { Stage } from "@/settings";

export type DeployPlan = "reset-to-sample-data" | "apply-table-changes";

/**
 * Which preview a database belongs to, or that it is the campus server's,
 * as marked in the database itself.
 */
export type DatabaseKind = "pr-preview" | "main-preview" | "campus";

export interface DeployTarget {
  marker: DatabaseKind | null;
  hasTables: boolean;
}

const MAIN_BRANCH = "main";

/**
 * What a Vercel build does to its database. A PR preview shares one
 * database with every other PR, so each deploy starts it over with its own
 * tables and the sample data. The preview of `main` is started over only
 * when `startOverReasonFor` gives a reason, and keeps its data otherwise.
 * Only a build that says it comes from `main` may deploy to it; a deploy
 * from the command line names no branch, and is refused.
 */
export function deployPlanFor(
  stage: Stage,
  branch: string | undefined,
): DeployPlan {
  if (stage === "pr-preview") return "reset-to-sample-data";
  if (stage === "main-preview") {
    if (branch !== MAIN_BRANCH) {
      throw new Error(
        `A production deploy from ${branch ? `the branch ${branch}` : "an unknown branch"} would change the database of main; refused.`,
      );
    }
    return "apply-table-changes";
  }
  throw new Error(
    `The deploy database step runs only in a Vercel build, not in ${stage}.`,
  );
}

/**
 * Checks that the database is the one the plan expects, before anything is
 * changed. A database that is not marked yet is marked on its first
 * deploy, but only when it holds no tables at all: either plan may start
 * it over, and nothing says its tables are a preview's.
 */
export function checkDeployTarget(
  plan: DeployPlan,
  target: DeployTarget,
): "go" | "mark-and-go" {
  const expected: DatabaseKind =
    plan === "reset-to-sample-data" ? "pr-preview" : "main-preview";
  if (target.marker === expected) return "go";
  if (target.marker !== null) {
    throw new Error(
      `This database is marked ${target.marker}, not ${expected}; refused.`,
    );
  }
  if (target.hasTables) {
    throw new Error(
      `This database is not marked ${expected} and holds tables; refused to empty it.`,
    );
  }
  return "mark-and-go";
}

export interface MainPreviewState {
  /** How many table changes the database says it has had applied. */
  tableChangesApplied: number;
  /** How many table changes the build brings. */
  tableChangesInRepo: number;
  holdsAnAccount: boolean;
  /** Whether the last start of this database by a deploy of `main` finished. */
  hasStartMark: boolean;
}

export type StartOverReason =
  | "new-table-change"
  | "no-account"
  | "no-start-mark";

/**
 * Why a deploy of `main` starts its database over with sample data, or
 * null when it keeps the data. A feature brings its sample data together
 * with its tables, so a new table change means the sample data is old. A
 * database with no account is empty, or was left so by a start that
 * failed after the tables were made. One with no mark of a start was
 * filled before the mark existed and never got the sample data merged
 * since, or its last start failed before the mark was written.
 */
export function startOverReasonFor(
  state: MainPreviewState,
): StartOverReason | null {
  if (state.tableChangesApplied < state.tableChangesInRepo) {
    return "new-table-change";
  }
  if (!state.holdsAnAccount) return "no-account";
  if (!state.hasStartMark) return "no-start-mark";
  return null;
}
