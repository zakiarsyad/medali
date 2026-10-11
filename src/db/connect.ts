import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  drizzle,
  type PostgresJsDatabase,
  type PostgresJsQueryResultHKT,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

/** The whole database or one transaction in it; both read and write alike. */
export type Database = PgDatabase<PostgresJsQueryResultHKT>;

export interface Connection {
  db: PostgresJsDatabase;
  close: () => Promise<void>;
}

export function connect(url: string): Connection {
  const client = postgres(url, {
    // The hosted database hands out connections through a pool that cannot
    // keep prepared statements between requests.
    prepare: false,
    // Applying table changes prints a notice for each step already done.
    onnotice: () => {},
  });
  return {
    db: drizzle({ client, casing: "snake_case" }),
    close: () => client.end(),
  };
}
