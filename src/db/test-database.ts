import { afterAll } from "vitest";
import { readSetting } from "@/settings";
import { connect, type Database } from "./connect";

class RolledBack extends Error {}

/**
 * Runs one check inside a transaction that is always undone, so the check
 * leaves nothing behind, not even lines in a log that cannot be deleted.
 */
export function withTestDatabase() {
  const connection = connect(readSetting("DATABASE_URL"));
  afterAll(() => connection.close());

  return async function inRolledBackTransaction(
    check: (db: Database) => Promise<void>,
  ): Promise<void> {
    try {
      await connection.db.transaction(async (tx) => {
        await check(tx);
        throw new RolledBack();
      });
    } catch (error) {
      if (!(error instanceof RolledBack)) throw error;
    }
  };
}
