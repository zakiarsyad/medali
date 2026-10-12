import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll } from "vitest";
import { readSetting } from "@/settings";
import { type Connection, connect } from "./connect";

interface Opened {
  admin: Connection;
  own: Connection;
}

function urlOf(database: string): string {
  const url = new URL(readSetting("DATABASE_URL"));
  url.pathname = `/${database}`;
  return url.href;
}

async function open(database: string): Promise<Opened> {
  const admin = connect(readSetting("DATABASE_URL"));
  await admin.db.execute(sql.raw(`create database ${database}`));
  return { admin, own: connect(urlOf(database)) };
}

async function closeAndDrop(opened: Opened, database: string): Promise<void> {
  await opened.own.close();
  await opened.admin.db.execute(
    sql.raw(`drop database if exists ${database} with (force)`),
  );
  await opened.admin.close();
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
  const database = `medali_test_${name}_${process.pid}`;
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
