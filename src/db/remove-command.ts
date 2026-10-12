import { copyDatabasesOf } from "./copy-databases";
import { databaseNameOf } from "./database-address";
import { removeDatabaseIfThere } from "./database-server";
import { removalPlanOf } from "./removal-plan";

async function removeCopyDatabases(): Promise<string[]> {
  const plan = removalPlanOf(copyDatabasesOf(process.env));
  const lines: string[] = [];
  for (const url of plan.remove) {
    const removed = await removeDatabaseIfThere(url);
    const name = databaseNameOf(url);
    lines.push(removed ? `${name}: removed.` : `${name}: was not there.`);
  }
  for (const name of plan.keep) {
    lines.push(`${name}: kept, a default database is never removed.`);
  }
  return lines;
}

removeCopyDatabases()
  .then((lines) => console.log(lines.join("\n")))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
