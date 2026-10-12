import type { SettingsEnv } from "@/settings";
import { checkNamesItsDatabase, databaseNameOf } from "./database-address";

/** The checks' database in the local Docker database and on GitHub. */
export const DEFAULT_TEST_DATABASE_URL =
  "postgres://medali@localhost:5432/medali_test";

function appDatabaseName(env: SettingsEnv): string | null {
  const url = env.DATABASE_URL;
  if (!url || !URL.canParse(url)) return null;
  checkNamesItsDatabase("DATABASE_URL", url);
  return databaseNameOf(url);
}

/**
 * The address the checks use: the copy's own when it names one, otherwise
 * the default. The checks rebuild and empty tables, so they are refused
 * the app's own database. The two are compared by name alone: one
 * computer can be written as an address in too many ways to tell two
 * servers apart safely.
 */
export function testDatabaseUrlOf(env: SettingsEnv): string {
  const url = env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  if (!URL.canParse(url)) {
    throw new Error(
      "The setting TEST_DATABASE_URL is not an address. Write it like DATABASE_URL, with another database name.",
    );
  }
  checkNamesItsDatabase("TEST_DATABASE_URL", url);
  const name = databaseNameOf(url);
  if (name === appDatabaseName(env)) {
    throw new Error(
      `The checks' database has the same name as the app's own database (${name}), and the checks would wipe its sample data. Give TEST_DATABASE_URL another database name than DATABASE_URL.`,
    );
  }
  return url;
}
