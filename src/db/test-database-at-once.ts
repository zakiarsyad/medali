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
  admin: Connection;
  first: Connection;
  second: Connection;
  holder: Connection;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function open(database: string): Promise<Opened> {
  const admin = await makeOwnTestDatabase(database);
  const first = connect(ownTestDatabaseUrl(database));
  const second = connect(ownTestDatabaseUrl(database));
  const holder = connect(ownTestDatabaseUrl(database));
  await applyTableChanges(first.db);
  return { admin, first, second, holder };
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

/**
 * Starts two saves at the same moment on two connections, each kept
 * waiting part-way by a hold of its own. Confirms both wait, then lets the
 * second save go on, and the first one only once the second has reached
 * its next wait: a save with nothing to wait for between its own steps
 * would otherwise finish before the first one goes on, and the two would
 * never meet. Gives both outcomes, so a save the database gives up shows
 * as a failed check.
 */
async function runHeld<Answer>(
  opened: Opened,
  first: HeldSave<Answer>,
  second: HeldSave<Answer>,
): Promise<BothSettled<Answer>> {
  const letFirstGo = await takeHold(opened.holder, first.hold);
  const letSecondGo = await takeHold(opened.holder, second.hold);
  const firstSave = first.save(opened.first.db);
  const secondSave = second.save(opened.second.db);
  const both = Promise.allSettled([firstSave, secondSave]);
  const firstIsDone = settledBy(firstSave);
  const secondIsDone = settledBy(secondSave);
  await wait(WAIT_MS);
  const doneWhileHeld = [firstIsDone(), secondIsDone()];
  await letSecondGo();
  await wait(WAIT_MS);
  await letFirstGo();
  const [firstOutcome, secondOutcome] = await both;
  expect(doneWhileHeld).toEqual([false, false]);
  return { first: firstOutcome, second: secondOutcome };
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
