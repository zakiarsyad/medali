import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { databaseAddressRefusal } from "./database-address";
import { runCommand } from "./run-command";

/**
 * Runs one database command of the campus server package. An address
 * that cannot be read is refused here in one line, before anything tries
 * to connect with it: the fault it would cause shows the whole address,
 * and the address holds the database's password.
 */
export function runGuardedCommand(
  task: (db: PostgresJsDatabase) => Promise<string>,
): void {
  const refusal = databaseAddressRefusal(process.env);
  if (refusal) {
    console.error(refusal);
    process.exitCode = 1;
    return;
  }
  runCommand(task);
}
