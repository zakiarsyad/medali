import { sql } from "drizzle-orm";
import type { Database } from "@/db/connect";

/**
 * Holds a key of a form entry or an upload until the transaction ends.
 * The two are kept in two tables, whose own key rules cannot see each
 * other: without this, a form entry and a file saved at the same moment
 * with the same key would both pass the check that the other table does
 * not have it, and both be kept.
 */
export async function lockEntryKey(tx: Database, key: string): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
  );
}
