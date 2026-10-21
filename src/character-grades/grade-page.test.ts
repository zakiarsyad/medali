// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { mayOpenTab } from "@/auth/access";
import { activeAccounts } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { fillWithSampleData } from "@/db/seed";
import { withTestDatabase } from "@/db/test-database";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeFilter,
  type GradeParams,
  START_PARAMS,
} from "@/features/character-grades/grade-address";
import type {
  GradeList,
  GradeRow,
} from "@/features/character-grades/grade-list";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import { gradeVisibleTo } from "@/features/character-grades/grade-students";
import { pageWithin } from "@/ui/list-pages";
import { readGradeBasis } from "./grade-facts";
import { readGradePage } from "./grade-page";
import { readGradeRows } from "./grade-rows";

const inTestDatabase = withTestDatabase();

/** A day long before every sample period. */
const NO_PERIOD_DAY = "2000-01-03";

/*
 * The way the list was worked out before the database did it: every
 * student's grade on the server, then the search, the filter and the
 * page. Kept here only, to hold the database to it.
 */

function isFailing(row: GradeRow): boolean {
  return row.grade.complete && !row.grade.passes;
}

function isKept(row: GradeRow, filter: GradeFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "failing":
      return isFailing(row);
    case "incomplete":
      return !row.grade.complete;
  }
}

function isFound(row: GradeRow, query: string): boolean {
  if (query === "") return true;
  const sought = query.toLocaleLowerCase("id-ID");
  const { name, nim } = row.student;
  return (
    name.toLocaleLowerCase("id-ID").includes(sought) || nim.includes(sought)
  );
}

function listInMemory(
  rows: readonly GradeRow[],
  params: GradeParams,
): GradeList {
  const kept = rows.filter(
    (row) => isKept(row, params.filter) && isFound(row, params.query),
  );
  const page = pageWithin(params.page, kept.length, GRADE_LIST_PAGE_SIZE);
  const start = (page - 1) * GRADE_LIST_PAGE_SIZE;
  return {
    rows: kept.slice(start, start + GRADE_LIST_PAGE_SIZE),
    matching: kept.length,
    page,
  };
}

/** The accounts of the sample data whose roles open the tab. */
async function readersOfTheTab(db: Database) {
  const accounts = await activeAccounts(db);
  return accounts.filter((account) =>
    mayOpenTab(account.roles, "assessment", "character"),
  );
}

/** Searches, filters and pages, a page past the end among them. */
function askedFor(rows: readonly GradeRow[]): GradeParams[] {
  const first = rows[0]?.student;
  const asked: GradeParams[] = [
    START_PARAMS,
    { ...START_PARAMS, page: 2 },
    { ...START_PARAMS, page: 99 },
    { ...START_PARAMS, filter: "failing" },
    { ...START_PARAMS, filter: "failing", page: 2 },
    { ...START_PARAMS, filter: "incomplete" },
    { ...START_PARAMS, filter: "incomplete", page: 99 },
    { ...START_PARAMS, query: "a" },
    { ...START_PARAMS, query: "a", filter: "failing", page: 3 },
    { ...START_PARAMS, query: "tidak ada yang bernama ini" },
  ];
  if (!first) return asked;
  const namePart = first.name.split(" ")[0] ?? first.name;
  return [
    ...asked,
    { ...START_PARAMS, query: namePart.toLocaleUpperCase("id-ID") },
    { ...START_PARAMS, query: first.nim.slice(2, 8) },
  ];
}

describe("readGradePage", { timeout: 120_000 }, () => {
  it("shows every role the rows, the order, the count and the page the server worked out before", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();
      const { scheme } = await readGradeScheme(db);
      const basis = await readGradeBasis(db, scheme, today);
      const readers = await readersOfTheTab(db);
      expect(readers.length).toBeGreaterThan(4);
      let compared = 0;

      for (const account of readers) {
        const visible = gradeVisibleTo(account);
        const { rows } = await readGradeRows(db, visible, scheme, today);
        for (const params of askedFor(rows)) {
          const found = await readGradePage(db, visible, basis, today, params);

          expect(found, `${account.name}: ${JSON.stringify(params)}`).toEqual(
            listInMemory(rows, params),
          );
          compared += found.rows.length;
        }
      }
      // The sample data gives many rows of each kind, so nothing passes empty.
      expect(compared).toBeGreaterThan(500);
    });
  });

  it("shows the same as before on a day no period runs, everybody Belum lengkap", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = NO_PERIOD_DAY;
      const { scheme } = await readGradeScheme(db);
      const basis = await readGradeBasis(db, scheme, today);
      const [reader] = await readersOfTheTab(db);
      if (!reader) throw new Error("No sample account opens the tab.");
      const visible = gradeVisibleTo(reader);
      const { rows } = await readGradeRows(db, visible, scheme, today);
      expect(basis.attendance).toBeNull();

      for (const params of askedFor(rows)) {
        const found = await readGradePage(db, visible, basis, today, params);

        expect(found).toEqual(listInMemory(rows, params));
      }
      const incomplete = await readGradePage(db, visible, basis, today, {
        ...START_PARAMS,
        filter: "incomplete",
      });
      expect(incomplete.matching).toBe(rows.length);
    });
  });
});
