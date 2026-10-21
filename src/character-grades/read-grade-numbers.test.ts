// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { fillWithSampleData } from "@/db/seed";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { readGradeBasis } from "./grade-facts";
import type { GradeRow } from "./grade-list";
import type { GradeNumbers } from "./grade-numbers";
import { readGradeRows } from "./grade-rows";
import { readGradeScheme } from "./grade-scheme";
import { gradeVisibleTo } from "./grade-students";
import { readGradeNumbers } from "./read-grade-numbers";
import { NO_PERIOD_DAY, sampleReaders } from "./test-sample-readers";

// Loading the sample data in the shared database keeps every other check
// that loads it waiting until this one ends, and this one reads every
// student's grade for many accounts: in a database of its own it holds
// back none of them.
const own = withOwnTestDatabase("angkanilaikarakter");

/**
 * The way the numbers were worked out before the database did it, from
 * every student's grade on the server. Kept here only, to hold the
 * database to it.
 */
function numbersInMemory(rows: readonly GradeRow[]): GradeNumbers {
  let sum = 0;
  let complete = 0;
  let passing = 0;
  let adjusted = 0;
  for (const row of rows) {
    if (row.siku.adjusted) adjusted += 1;
    if (!row.grade.complete) continue;
    complete += 1;
    sum += row.grade.final;
    if (row.grade.passes) passing += 1;
  }
  const meanFinal =
    complete === 0 ? null : Math.round((sum / complete) * 10) / 10;
  return {
    students: rows.length,
    meanFinal,
    complete,
    passing,
    adjusted,
    incomplete: rows.length - complete,
  };
}

describe("readGradeNumbers", { timeout: 60_000 }, () => {
  it("gives each role the four numbers the server worked out before", async () => {
    const { db } = own;
    await fillWithSampleData(db);
    const { scheme } = await readGradeScheme(db);
    const readers = await sampleReaders(db);
    const found: GradeNumbers[] = [];

    for (const today of [campusDay(), NO_PERIOD_DAY]) {
      const basis = await readGradeBasis(db, scheme, today);
      for (const account of readers) {
        const visible = gradeVisibleTo(account);
        const { rows } = await readGradeRows(db, visible, scheme, today);

        const numbers = await readGradeNumbers(db, visible, basis);

        expect(numbers, `${account.name} on ${today}`).toEqual(
          numbersInMemory(rows),
        );
        found.push(numbers);
      }
    }
    // So the comparison never passes on numbers that are all empty.
    const kepala = found[0];
    expect(kepala?.meanFinal).not.toBeNull();
    expect(kepala?.passing).toBeGreaterThan(0);
    expect(kepala?.complete).toBeGreaterThan(kepala?.passing ?? 0);
    expect(kepala?.adjusted).toBeGreaterThan(0);
    expect(kepala?.incomplete).toBeGreaterThan(0);
  });
});
