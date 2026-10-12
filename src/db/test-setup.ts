import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import type { TestProject } from "vitest/node";
import type { SettingsEnv } from "@/settings";
import { connect } from "./connect";
import { applyTableChanges } from "./migrate";
import { testDatabaseUrlOf } from "./test-database-url";

declare module "vitest" {
  interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

const LOCAL_SETTINGS_FILE = ".env.local";

function localSettings(repoFolder: string): SettingsEnv {
  const file = join(repoFolder, LOCAL_SETTINGS_FILE);
  if (!existsSync(file)) return {};
  return parseEnv(readFileSync(file, "utf8"));
}

/**
 * Picks the checks' database from the local settings and what is set on
 * the computer, which wins, as it does for the database commands. Only
 * the address is passed on to the checks, never the other local settings,
 * so the checks run the same on every computer and on GitHub.
 */
function testDatabaseUrl(repoFolder: string): string {
  return testDatabaseUrlOf({ ...localSettings(repoFolder), ...process.env });
}

export default async function setup(project: TestProject): Promise<void> {
  const url = testDatabaseUrl(project.config.root);
  project.provide("testDatabaseUrl", url);
  const connection = connect(url);
  try {
    await applyTableChanges(connection.db);
  } catch (error) {
    throw new Error(
      "The checks need the database. Start it with: pnpm db:start",
      { cause: error },
    );
  } finally {
    await connection.close();
  }
}
