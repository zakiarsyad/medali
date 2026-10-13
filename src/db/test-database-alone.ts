import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll } from "vitest";
import { type Connection, connect } from "./connect";
import {
  dropOwnTestDatabase,
  makeOwnTestDatabase,
  ownTestDatabaseName,
  ownTestDatabaseUrl,
} from "./test-database-own";

interface Opened {
  admin: Connection;
  own: Connection;
}

async function open(database: string): Promise<Opened> {
  const admin = await makeOwnTestDatabase(database);
  return { admin, own: connect(ownTestDatabaseUrl(database)) };
}

async function closeAndDrop(opened: Opened, database: string): Promise<void> {
  await opened.own.close();
  await dropOwnTestDatabase(opened.admin, database);
}

/**
 * A check that marks a database, or builds its tables from nothing,
 * cannot run in the checks' shared database, not even inside a
 * transaction that is undone: table changes are applied on a connection
 * of their own. A file of such checks gets an empty database here, made
 * before its checks and dropped after them, so no other check ever sees
 * what it does. `name` is one lowercase word, different for each file.
 */
export function withEmptyTestDatabase(name: string) {
  const database = ownTestDatabaseName(name);
  let opened: Opened | undefined;

  beforeAll(async () => {
    opened = await open(database);
  });
  afterAll(async () => {
    if (opened) await closeAndDrop(opened, database);
  });

  return {
    get db(): PostgresJsDatabase {
      if (!opened) throw new Error("The database of these checks is not made.");
      return opened.own.db;
    },
  };
}
