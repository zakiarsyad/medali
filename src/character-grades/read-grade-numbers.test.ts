// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { mayOpenTab } from "@/auth/access";
import { activeAccounts } from "@/auth/accounts";
import { fillWithSampleData } from "@/db/seed";
import { withTestDatabase } from "@/db/test-database";
import type { GradeRow } from "@/features/character-grades/grade-list";
import type { GradeNumbers } from "@/features/character-grades/grade-numbers";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import { gradeVisibleTo } from "@/features/character-grades/grade-students";
import { readGradeBasis } from "./grade-facts";
import { readGradeRows } from "./grade-rows";
import { readGradeNumbers } from "./read-grade-numbers";

const inTestDatabase = withTestDatabase();

/** A day long before every sample period. */
const NO_PERIOD_DAY = "2000-01-03";

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

describe("readGradeNumbers", { timeout: 120_000 }, () => {
  it("gives every role the four numbers the server worked out before", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      for (const today of [campusDay(), NO_PERIOD_DAY]) {
        const { scheme } = await readGradeScheme(db);
        const basis = await readGradeBasis(db, scheme, today);
        const accounts = await activeAccounts(db);
        const readers = accounts.filter((account) =>
          mayOpenTab(account.roles, "assessment", "character"),
        );
        expect(readers.length).toBeGreaterThan(4);

        for (const account of readers) {
          const visible = gradeVisibleTo(account);
          const { rows } = await readGradeRows(db, visible, scheme, today);

          const found = await readGradeNumbers(db, visible, basis);

          expect(found, `${account.name} on ${today}`).toEqual(
            numbersInMemory(rows),
          );
        }
      }
    });
  });

  it("works out a mean, a pass and an adjustment from the sample data", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();
      const { scheme } = await readGradeScheme(db);
      const basis = await readGradeBasis(db, scheme, today);
      const [reader] = (await activeAccounts(db)).filter((account) =>
        account.roles.includes("head_of_unit"),
      );
      if (!reader) throw new Error("No sample Kepala Unit.");

      const found = await readGradeNumbers(db, gradeVisibleTo(reader), basis);

      // So the comparison above never passes on numbers that are all empty.
      expect(found.meanFinal).not.toBeNull();
      expect(found.passing).toBeGreaterThan(0);
      expect(found.complete).toBeGreaterThan(found.passing);
      expect(found.adjusted).toBeGreaterThan(0);
      expect(found.incomplete).toBeGreaterThan(0);
    });
  });
});
