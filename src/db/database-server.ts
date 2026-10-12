import { sql } from "drizzle-orm";
import { connect } from "./connect";
import { databaseNameOf } from "./database-address";

/** The database every PostgreSQL server has, used to reach the server itself. */
const SERVER_DATABASE = "postgres";

type ServerTask<Result> = (
  server: ReturnType<typeof connect>["db"],
  name: string,
) => Promise<Result>;

/**
 * Runs one task on the server that holds a database. A database cannot be
 * made or removed from inside itself, so the task goes through the
 * server's own database.
 */
async function onServerOf<Result>(
  url: string,
  task: ServerTask<Result>,
): Promise<Result> {
  const serverUrl = new URL(url);
  serverUrl.pathname = `/${SERVER_DATABASE}`;
  const connection = connect(serverUrl.href);
  try {
    return await task(connection.db, databaseNameOf(url));
  } finally {
    await connection.close();
  }
}

/** Makes the database an address names. False when it was already there. */
export function createDatabaseIfMissing(url: string): Promise<boolean> {
  return onServerOf(url, async (server, name) => {
    const found = await server.execute(
      sql`select 1 from pg_database where datname = ${name}`,
    );
    if (found.length > 0) return false;
    await server.execute(sql`create database ${sql.identifier(name)}`);
    return true;
  });
}

/** Removes the database an address names. False when there was none. */
export function removeDatabaseIfThere(url: string): Promise<boolean> {
  return onServerOf(url, async (server, name) => {
    const found = await server.execute(
      sql`select 1 from pg_database where datname = ${name}`,
    );
    if (found.length === 0) return false;
    // A copy's app or checks may still hold a connection to it.
    await server.execute(
      sql`drop database ${sql.identifier(name)} with (force)`,
    );
    return true;
  });
}
