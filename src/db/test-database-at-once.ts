import { sql } from "drizzle-orm";
import { afterAll, beforeAll, expect } from "vitest";
import { type Connection, connect, type Database } from "./connect";
import { applyTableChanges } from "./migrate";
import {
  dropOwnTestDatabase,
  makeOwnTestDatabase,
  ownTestDatabaseName,
  ownTestDatabaseUrl,
} from "./test-database-own";

/** Long enough for the second save to reach the database and wait there. */
const WAIT_MS = 400;
/**
 * How often, and how long at most, to look for a save waiting for a lock.
 * The limit stays well under the five seconds a check may take, so a save
 * that never waits fails with its own message, not as a timed-out check.
 */
const LOOK_AGAIN_MS = 20;
const LOCK_WAIT_LIMIT_MS = 2000;

export type Save<Answer> = (db: Database) => Promise<Answer>;

export interface Both<Answer> {
  sooner: Answer;
  later: Answer;
}

/** A lock a third connection takes, and keeps until it is let go. */
export type Hold = (tx: Database) => Promise<unknown>;

/** A save, and the lock that keeps it waiting part-way. */
export interface HeldSave<Answer> {
  hold: Hold;
  save: Save<Answer>;
}

export interface BothSettled<Answer> {
  first: PromiseSettledResult<Answer>;
  second: PromiseSettledResult<Answer>;
}

interface Opened {
  database: string;
  admin: Connection;
  first: Connection;
  second: Connection;
  holder: Connection;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The name the database shows for the connections of one role. */
function connectionName(database: string, role: "first" | "second"): string {
  return `${database}_${role}`;
}

function connectNamed(database: string, role: "first" | "second") {
  const url = new URL(ownTestDatabaseUrl(database));
  url.searchParams.set("application_name", connectionName(database, role));
  return connect(url.href);
}

async function open(database: string): Promise<Opened> {
  const admin = await makeOwnTestDatabase(database);
  const first = connectNamed(database, "first");
  const second = connectNamed(database, "second");
  const holder = connect(ownTestDatabaseUrl(database));
  await applyTableChanges(first.db);
  return { database, admin, first, second, holder };
}

async function closeAndDrop(opened: Opened, database: string): Promise<void> {
  await opened.first.close();
  await opened.second.close();
  await opened.holder.close();
  await dropOwnTestDatabase(opened.admin, database);
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
 * Takes a hold in a transaction of its own, and gives back what lets it
 * go: that ends the transaction and waits until it has ended.
 */
async function takeHold(
  holder: Connection,
  hold: Hold,
): Promise<() => Promise<void>> {
  const taken = Promise.withResolvers<void>();
  const letGo = Promise.withResolvers<void>();
  const held = holder.db.transaction(async (tx) => {
    await hold(tx);
    taken.resolve();
    await letGo.promise;
  });
  await Promise.race([taken.promise, held]);
  return async () => {
    letGo.resolve();
    await held;
  };
}

/** Whether a promise is settled by now, without waiting for it. */
function settledBy(promise: Promise<unknown>): () => boolean {
  let settled = false;
  const markSettled = () => {
    settled = true;
  };
  promise.then(markSettled, markSettled);
  return () => settled;
}

/** Whether a connection of one role waits for a lock another one holds. */
async function waitsOnLock(
  opened: Opened,
  role: "first" | "second",
): Promise<boolean> {
  const [row] = await opened.admin.db.execute<{ waits: boolean }>(sql`
    select exists (
      select 1 from pg_stat_activity
      where application_name = ${connectionName(opened.database, role)}
        and cardinality(pg_blocking_pids(pid)) > 0
    ) as waits`);
  return row?.waits === true;
}

/** Looks again and again until `isMet`, and fails once the limit passes. */
async function waitUntil(
  isMet: () => Promise<boolean>,
  what: string,
): Promise<void> {
  const until = Date.now() + LOCK_WAIT_LIMIT_MS;
  while (!(await isMet())) {
    if (Date.now() > until) throw new Error(`${what} did not happen.`);
    await wait(LOOK_AGAIN_MS);
  }
}

/**
 * Starts two saves at the same moment on two connections, each kept
 * waiting part-way by a hold of its own. Confirms the database shows both
 * waiting for a lock, then lets the second save go on, and the first one
 * only once the second has finished or waits for a lock again: a save
 * with nothing to wait for between its own steps would otherwise finish
 * before the first one goes on, and the two would never meet. Every hold
 * is let go, also when something fails. Gives both outcomes, so a save
 * the database gives up shows as a failed check.
 */
async function runHeld<Answer>(
  opened: Opened,
  first: HeldSave<Answer>,
  second: HeldSave<Answer>,
): Promise<BothSettled<Answer>> {
  const holds: Array<() => Promise<void>> = [];
  let both:
    | Promise<[PromiseSettledResult<Answer>, PromiseSettledResult<Answer>]>
    | undefined;
  try {
    const letFirstGo = await takeHold(opened.holder, first.hold);
    holds.push(letFirstGo);
    const letSecondGo = await takeHold(opened.holder, second.hold);
    holds.push(letSecondGo);
    const firstSave = first.save(opened.first.db);
    const secondSave = second.save(opened.second.db);
    both = Promise.allSettled([firstSave, secondSave]);
    const secondIsDone = settledBy(secondSave);
    await waitUntil(
      () => waitsOnLock(opened, "first"),
      "The first save waiting for its hold",
    );
    await waitUntil(
      () => waitsOnLock(opened, "second"),
      "The second save waiting for its hold",
    );
    await letSecondGo();
    await waitUntil(
      async () => secondIsDone() || (await waitsOnLock(opened, "second")),
      "The second save finishing or waiting again",
    );
    await letFirstGo();
    const [firstOutcome, secondOutcome] = await both;
    return { first: firstOutcome, second: secondOutcome };
  } finally {
    for (const letGo of holds) await letGo();
    await both;
  }
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
  const database = ownTestDatabaseName(name);
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
    heldAtOnce<Answer>(
      first: HeldSave<Answer>,
      second: HeldSave<Answer>,
    ): Promise<BothSettled<Answer>> {
      return runHeld(connections(), first, second);
    },
  };
}
