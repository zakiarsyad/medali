import type { SettingsEnv } from "@/settings";
import { sameDatabase } from "./database-address";

/** The checks' database in the local Docker database and on GitHub. */
export const DEFAULT_TEST_DATABASE_URL =
  "postgres://medali@localhost:5432/medali_test";

/**
 * The address the checks use: the copy's own when it names one, otherwise
 * the default. The checks rebuild and empty tables, so an address that is
 * the app's own database is refused.
 */
export function testDatabaseUrlOf(env: SettingsEnv): string {
  const url = env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  if (!URL.canParse(url)) {
    throw new Error(
      "The setting TEST_DATABASE_URL is not an address. Write it like DATABASE_URL, with another database name.",
    );
  }
  if (env.DATABASE_URL && sameDatabase(url, env.DATABASE_URL)) {
    throw new Error(
      "The checks' database is the app's own database, and the checks would wipe its sample data. Give TEST_DATABASE_URL another database name than DATABASE_URL.",
    );
  }
  return url;
}
