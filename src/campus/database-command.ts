import { Refusal } from "@/db/refusal";
import { runGuardedCommand } from "@/db/run-guarded-command";
import { hasCampusMark } from "@/settings";
import { prepareCampusDatabase } from "./prepare-database";

runGuardedCommand(async (db) => {
  if (!hasCampusMark(process.env)) {
    throw new Refusal(
      "This command marks its database as the campus one, so it runs only in the campus server package.",
    );
  }
  const added = await prepareCampusDatabase(db);
  return `The database is marked as the campus one. New table changes applied: ${added}. Data kept.`;
});
