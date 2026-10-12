import { connect } from "./connect";
import { copyDatabasesOf } from "./copy-databases";
import { databaseNameOf } from "./database-address";
import { createDatabaseIfMissing } from "./database-server";
import { readDeployTarget } from "./deploy-target";
import { applyTableChanges } from "./migrate";
import { rebuildTables } from "./rebuild";
import { fillWithSampleData } from "./seed";

/**
 * Brings the app's database up to date. Sample data goes in only while it
 * has no tables, so running the command again never replaces a copy's data.
 */
async function prepareAppDatabase(url: string): Promise<string> {
  const name = databaseNameOf(url);
  const connection = connect(url);
  try {
    const { hasTables } = await readDeployTarget(connection.db);
    if (hasTables) {
      await applyTableChanges(connection.db);
      return `${name}: already has its tables, data left as it is.`;
    }
    await rebuildTables(connection.db);
    await fillWithSampleData(connection.db);
    return `${name}: tables made and sample data loaded.`;
  } finally {
    await connection.close();
  }
}

async function createCopyDatabases(): Promise<string[]> {
  const copy = copyDatabasesOf(process.env);
  await createDatabaseIfMissing(copy.app);
  const madeTest = await createDatabaseIfMissing(copy.test);
  const testName = databaseNameOf(copy.test);
  return [
    await prepareAppDatabase(copy.app),
    madeTest
      ? `${testName}: made for the checks.`
      : `${testName}: already there for the checks.`,
  ];
}

createCopyDatabases()
  .then((lines) => console.log(lines.join("\n")))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
