import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export const MIGRATIONS_FOLDER = "src/db/migrations";

export async function applyTableChanges(db: PostgresJsDatabase): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
