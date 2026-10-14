import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { afterAll, expect } from "vitest";
import { readSetting } from "@/settings";
import { connect, type Database } from "./connect";
import { academicPeriods } from "./schema";
import {
  type NamedYears,
  namedYearsIn,
  unnamedYears,
  unnamedYearsMessage,
} from "./test-period-years";

class RolledBack extends Error {}

/** The code PostgreSQL gives a statement that follows a failed one. */
const TRANSACTION_ABORTED = "25P02";

interface TestFile {
  path: string;
  named: NamedYears | undefined;
}

function runningTestFile(): TestFile {
  const { testPath } = expect.getState();
  if (!testPath) throw new Error("This check runs outside a test file.");
  return {
    path: relative(process.cwd(), testPath).replaceAll(sep, "/"),
    named: namedYearsIn(readFileSync(testPath, "utf8")),
  };
}

function isAborted(error: unknown): boolean {
  let fault = error;
  while (fault instanceof Error) {
    if ("code" in fault && fault.code === TRANSACTION_ABORTED) return true;
    fault = fault.cause;
  }
  return false;
}

/**
 * The shared database keeps no period between checks, so every period
 * in it was added by the running check. A check that ends on a statement
 * the database refused leaves a transaction that answers nothing more:
 * its years cannot be read, and none is given.
 */
async function addedYears(db: Database): Promise<number[]> {
  try {
    const periods = await db
      .selectDistinct({ startYear: academicPeriods.startYear })
      .from(academicPeriods);
    return periods.map((period) => period.startYear);
  } catch (error) {
    if (isAborted(error)) return [];
    throw error;
  }
}

async function refuseUnnamedYears(db: Database, file: TestFile): Promise<void> {
  const unnamed = unnamedYears(await addedYears(db), file.named);
  if (unnamed.length === 0) return;
  throw new Error(unnamedYearsMessage(file.path, unnamed));
}

/**
 * Runs one check inside a transaction that is always undone, so the check
 * leaves nothing behind, not even lines in a log that cannot be deleted.
 * A check that added a Tahun akademik its test file does not name fails.
 */
export function withTestDatabase() {
  const connection = connect(readSetting("DATABASE_URL"));
  afterAll(() => connection.close());
  let testFile: TestFile | undefined;

  return async function inRolledBackTransaction(
    check: (db: Database) => Promise<void>,
  ): Promise<void> {
    testFile ??= runningTestFile();
    const file = testFile;
    try {
      await connection.db.transaction(async (tx) => {
        await check(tx);
        await refuseUnnamedYears(tx, file);
        throw new RolledBack();
      });
    } catch (error) {
      if (!(error instanceof RolledBack)) throw error;
    }
  };
}
