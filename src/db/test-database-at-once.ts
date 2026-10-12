import { sql } from "drizzle-orm";
import { afterAll, beforeAll, expect } from "vitest";
import { readSetting } from "@/settings";
import { type Connection, connect, type Database } from "./connect";
import { applyTableChanges } from "./migrate";

/** Long enough for the second save to reach the database and wait there. */
const WAIT_MS = 400;

export type Save<Answer> = (db: Database) => Promise<Answer>;

export interface Both<Answer> {
  sooner: Answer;
  later: Answer;
}

interface Opened {
  admin: Connection;
  first: Connection;
  second: Connection;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function urlOf(database: string): string {
  const url = new URL(readSetting("DATABASE_URL"));
  url.pathname = `/${database}`;
  return url.href;
}

async function open(database: string): Promise<Opened> {
  const admin = connect(readSetting("DATABASE_URL"));
  await admin.db.execute(sql.raw(`create database ${database}`));
  const first = connect(urlOf(database));
  const second = connect(urlOf(database));
  await applyTableChanges(first.db);
  return { admin, first, second };
}

async function closeAndDrop(opened: Opened, database: string): Promise<void> {
  await opened.first.close();
  await opened.second.close();
  await opened.admin.db.execute(
    sql.raw(`drop database if exists ${database} with (force)`),
  );
  await opened.admin.close();
}

/**
 * Runs one save, and starts a second one on another connection before the
 * first is finished. Confirms the second one waits, then gives both
 * answers.
 */
async function runAtOnce<Answer>(
  opened: Opened,
  soonerSave: Save<Answer>,
  laterSave: Save<Answer>,
): Promise<Both<Answer>> {
  let later: Promise<Answer> | undefined;
  let laterIsDone = false;
  const sooner = await opened.first.db.transaction(async (tx) => {
    const saved = await soonerSave(tx);
    later = laterSave(opened.second.db);
    // Kept from failing the check before it is awaited below.
    later.then(
      () => {
        laterIsDone = true;
      },
      () => {
        laterIsDone = true;
      },
    );
    await wait(WAIT_MS);
    expect(laterIsDone).toBe(false);
    return saved;
  });
  if (!later) throw new Error("The second save was not started.");
  return { sooner, later: await later };
}

/**
 * Two people at the same moment need two connections that both see the
 * same saved rows, so such checks cannot run inside a transaction that is
 * undone. A file of checks gets a database of its own here, made before
 * its checks and dropped after them, so no other check ever sees its rows.
 * The file removes its own rows after each check. `name` is one lowercase
 * word, different for each file.
 */
export function withOwnTestDatabase(name: string) {
  const database = `medali_test_${name}_${process.pid}`;
  let opened: Opened | undefined;

  beforeAll(async () => {
    opened = await open(database);
  });
  afterAll(async () => {
    if (opened) await closeAndDrop(opened, database);
  });

  function connections(): Opened {
    if (!opened) throw new Error("The database of these checks is not made.");
    return opened;
  }

  return {
    /** The connection the checks prepare and read with. */
    get db(): Database {
      return connections().first.db;
    },
    /** A second connection, for a save that must not wait for the first. */
    get otherDb(): Database {
      return connections().second.db;
    },
    atOnce<Answer>(
      soonerSave: Save<Answer>,
      laterSave: Save<Answer>,
    ): Promise<Both<Answer>> {
      return runAtOnce(connections(), soonerSave, laterSave);
    },
  };
}
