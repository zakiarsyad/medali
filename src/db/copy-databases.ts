import type { SettingsEnv } from "@/settings";
import { databaseNameOf, pointsAtThisComputer } from "./database-address";
import { testDatabaseUrlOf } from "./test-database-url";

/** The databases the database server keeps for itself. */
const SERVER_DATABASE_NAMES: readonly string[] = [
  "postgres",
  "template0",
  "template1",
];

const ALLOWED_NAME = /^[a-z_][a-z0-9_]{0,62}$/;

/** The addresses of the two databases of one copy of the repo. */
export interface CopyDatabases {
  app: string;
  test: string;
}

function checkAddress(setting: string, url: string): void {
  if (!pointsAtThisComputer(url)) {
    throw new Error(
      `${setting} is not a database on this computer. This command only makes and removes databases in the local Docker database.`,
    );
  }
  const name = databaseNameOf(url);
  if (!ALLOWED_NAME.test(name)) {
    throw new Error(
      `${setting} names the database "${name}". Use only small letters, digits and underscores, such as medali_two.`,
    );
  }
  if (SERVER_DATABASE_NAMES.includes(name)) {
    throw new Error(
      `${setting} names the database "${name}", which the database server keeps for itself. Choose another name.`,
    );
  }
}

/**
 * The two databases a copy's settings name, for the commands that make
 * and remove them. Both must be on this computer, so neither command can
 * ever reach a preview or the campus server.
 */
export function copyDatabasesOf(env: SettingsEnv): CopyDatabases {
  const app = env.DATABASE_URL;
  if (!app) {
    throw new Error(
      "The setting DATABASE_URL is missing. Copy .env.example to .env.local and fill it in.",
    );
  }
  const test = testDatabaseUrlOf(env);
  checkAddress("DATABASE_URL", app);
  checkAddress("TEST_DATABASE_URL", test);
  return { app, test };
}
