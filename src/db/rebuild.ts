import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { applyTableChanges } from "./migrate";

/**
 * Removes every table and builds them again from the table changes. This
 * is the only way to start a database over: the role change log refuses
 * to be emptied.
 */
export async function rebuildTables(db: PostgresJsDatabase): Promise<void> {
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`create schema public`);
  await applyTableChanges(db);
}
