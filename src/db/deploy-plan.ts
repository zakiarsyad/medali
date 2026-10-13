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
 * tables and the sample data. The preview of `main` keeps its data, and
 * only a build that says it comes from `main` may deploy to it; a deploy
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
 * deploy, but only reset when it holds no tables at all.
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
  if (plan === "reset-to-sample-data" && target.hasTables) {
    throw new Error(
      "This database is not marked as the PR preview one and holds tables; refused to empty it.",
    );
  }
  return "mark-and-go";
}
