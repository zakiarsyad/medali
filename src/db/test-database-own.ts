import { sql } from "drizzle-orm";
import { readSetting } from "@/settings";
import { type Connection, connect } from "./connect";

/*
 * What every file of checks with a database of its own needs: its name,
 * its address, and making and dropping it beside the checks' shared one.
 */

/** `name` is one lowercase word, different for each file of checks. */
export function ownTestDatabaseName(name: string): string {
  return `medali_test_${name}_${process.pid}`;
}

export function ownTestDatabaseUrl(database: string): string {
  const url = new URL(readSetting("DATABASE_URL"));
  url.pathname = `/${database}`;
  return url.href;
}

/** Makes the database, and gives the connection that can drop it again. */
export async function makeOwnTestDatabase(
  database: string,
): Promise<Connection> {
  const admin = connect(readSetting("DATABASE_URL"));
  await admin.db.execute(sql.raw(`create database ${database}`));
  return admin;
}

/** Drops the database, once every connection to it is closed. */
export async function dropOwnTestDatabase(
  admin: Connection,
  database: string,
): Promise<void> {
  await admin.db.execute(
    sql.raw(`drop database if exists ${database} with (force)`),
  );
  await admin.close();
}
