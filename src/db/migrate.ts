import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export const MIGRATIONS_FOLDER = "src/db/migrations";

export async function applyTableChanges(db: PostgresJsDatabase): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/** How many table changes the repo holds. */
export function countTableChangesInRepo(): number {
  return readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER }).length;
}

/** How many table changes the database says it has had applied so far. */
export async function countTableChangesApplied(
  db: PostgresJsDatabase,
): Promise<number> {
  const found = await db.execute<{ table: string | null }>(
    sql`select to_regclass('drizzle.__drizzle_migrations')::text as table`,
  );
  if (!found[0]?.table) return 0;
  const counted = await db.execute<{ total: number }>(
    sql`select count(*)::int as total from drizzle.__drizzle_migrations`,
  );
  return counted[0]?.total ?? 0;
}
