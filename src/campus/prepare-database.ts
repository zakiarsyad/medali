import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { markDatabase, readDeployTarget } from "@/db/deploy-target";
import { applyTableChanges, countTableChangesApplied } from "@/db/migrate";
import { checkCampusDatabase } from "./campus-database";

/**
 * Gets the database of the campus server package ready: marked as the
 * campus one, and with every table change applied. Gives how many table
 * changes were new. A table change is applied once; the data is kept.
 */
export async function prepareCampusDatabase(
  db: PostgresJsDatabase,
): Promise<number> {
  const target = await readDeployTarget(db);
  const check = checkCampusDatabase(target.marker);
  if (check === "mark-and-go") await markDatabase(db, "campus");
  const before = await countTableChangesApplied(db);
  await applyTableChanges(db);
  return (await countTableChangesApplied(db)) - before;
}
