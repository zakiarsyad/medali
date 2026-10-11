import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { readSetting } from "@/settings";
import { connect } from "./connect";

/** Runs one database command from the terminal, and fails loudly. */
export function runCommand(task: (db: PostgresJsDatabase) => Promise<string>) {
  const connection = connect(readSetting("DATABASE_URL"));
  task(connection.db)
    .then((done) => console.log(done))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => connection.close());
}
