// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { fillWithSampleData } from "@/db/seed";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { pageWithin } from "@/ui/list-pages";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeFilter,
  type GradeParams,
  START_PARAMS,
} from "./grade-address";
import { readGradeBasis } from "./grade-facts";
import type { GradeList, GradeRow } from "./grade-list";
import { readGradePage } from "./grade-page";
import { readGradeRows } from "./grade-rows";
import { readGradeScheme } from "./grade-scheme";
import { gradeVisibleTo } from "./grade-students";
import { NO_PERIOD_DAY, sampleReaders } from "./test-sample-readers";

// Loading the sample data in the shared database keeps every other check
// that loads it waiting until this one ends, and this one asks many pages
// for many accounts: in a database of its own it holds back none of them.
const own = withOwnTestDatabase("daftarnilaikarakter");

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

describe("readGradePage", { timeout: 60_000 }, () => {
  it("shows each role the rows, the order, the count and the page the server worked out before", async () => {
    const { db } = own;
    await fillWithSampleData(db);
    const { scheme } = await readGradeScheme(db);
    const readers = await sampleReaders(db);
    let compared = 0;

    for (const today of [campusDay(), NO_PERIOD_DAY]) {
      const basis = await readGradeBasis(db, scheme, today);
      for (const account of readers) {
        const visible = gradeVisibleTo(account);
        const { rows } = await readGradeRows(db, visible, scheme, today);
        for (const params of askedFor(rows)) {
          const found = await readGradePage(db, visible, basis, today, params);

          const asked = `${account.name} on ${today}: ${JSON.stringify(params)}`;
          expect(found, asked).toEqual(listInMemory(rows, params));
          compared += found.rows.length;
        }
      }
    }
    // The sample data gives many rows of each kind, so nothing passes empty.
    expect(compared).toBeGreaterThan(500);
  });
});
