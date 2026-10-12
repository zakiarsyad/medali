import type { CopyDatabases } from "./copy-databases";
import { databaseNameOf } from "./database-address";

/** The two databases every copy uses until its settings name its own. */
const DEFAULT_DATABASE_NAMES: readonly string[] = ["medali", "medali_test"];

export interface RemovalPlan {
  /** The addresses of the databases to remove. */
  remove: string[];
  /** The names of the default databases, which are always kept. */
  keep: string[];
}

/** Which of a copy's two databases may be removed: never a default one. */
export function removalPlanOf(copy: CopyDatabases): RemovalPlan {
  const plan: RemovalPlan = { remove: [], keep: [] };
  for (const url of [copy.app, copy.test]) {
    const name = databaseNameOf(url);
    if (DEFAULT_DATABASE_NAMES.includes(name)) {
      plan.keep.push(name);
      continue;
    }
    plan.remove.push(url);
  }
  return plan;
}
