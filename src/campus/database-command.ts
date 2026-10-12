import { markDatabase, readDeployTarget } from "@/db/deploy-target";
import { applyTableChanges, countTableChangesApplied } from "@/db/migrate";
import { runCommand } from "@/db/run-command";
import { hasCampusMark } from "@/settings";
import { checkCampusDatabase } from "./campus-database";

/**
 * Gets the database of the campus server package ready when it starts:
 * marked as the campus one, and with every table change applied. A table
 * change is applied once; the data is kept.
 */
runCommand(async (db) => {
  if (!hasCampusMark(process.env)) {
    throw new Error(
      "This command marks its database as the campus one, so it runs only in the campus server package.",
    );
  }
  const target = await readDeployTarget(db);
  const check = checkCampusDatabase(target.marker);
  if (check === "mark-and-go") await markDatabase(db, "campus");
  const before = await countTableChangesApplied(db);
  await applyTableChanges(db);
  const added = (await countTableChangesApplied(db)) - before;
  return `The database is marked as the campus one. New table changes applied: ${added}. Data kept.`;
});
