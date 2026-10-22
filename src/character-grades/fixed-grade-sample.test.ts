// Sample Tahun akademik of this file: those of the app's sample data.
import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { academicPeriods } from "@/db/schema";
import { fillWithSampleData } from "@/db/seed";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  GRADE_LIST_PAGE_SIZE,
  START_PARAMS,
} from "@/features/character-grades/grade-address";
import { readClosedPeriods } from "./closed-semesters";
import { readClosingGrades } from "./closing-grades";
import { readFixedGradeTab } from "./fixed-grade-tab";
import { keepClosing } from "./keep-closing";
import { sampleReaders } from "./test-sample-readers";

// A closed semester cannot be deleted, so the closing is kept in a
// database of its own, which is dropped at the end.
const own = withOwnTestDatabase("nilaitetapsampel");

/** "Within about 1 second", for all the tab reads of a closed period. */
const TAB_LIMIT_MS = 1000;

describe("a closed semester of the sample data", { timeout: 60_000 }, () => {
  it("shows each role a page of 25 fixed grades within about 1 second", async () => {
    const { db } = own;
    await fillWithSampleData(db);
    const [oldest] = await db
      .select()
      .from(academicPeriods)
      .orderBy(asc(academicPeriods.startsOn))
      .limit(1);
    const readers = await sampleReaders(db);
    const kepala = readers.find((each) => each.roles.includes("head_of_unit"));
    if (!oldest || !kepala) throw new Error("The sample data is not loaded.");
    const grades = await readClosingGrades(db, oldest, campusDay());
    await keepClosing(db, {
      periodId: oldest.id,
      closedBy: kepala.id,
      ...grades,
    });

    for (const account of readers) {
      const started = performance.now();
      const [closing] = await readClosedPeriods(db);
      if (!closing) throw new Error("The closing was not kept.");
      const tab = await readFixedGradeTab(
        db,
        account,
        closing.closingId,
        START_PARAMS,
      );
      const took = performance.now() - started;

      if (tab === "refused") throw new Error(`${account.name} was refused.`);
      expect(took, account.name).toBeLessThan(TAB_LIMIT_MS);
      expect(tab.list.rows.length).toBe(
        Math.min(GRADE_LIST_PAGE_SIZE, tab.list.matching),
      );
      expect(tab.numbers.students).toBe(tab.list.matching);
    }
    const tab = await readFixedGradeTab(
      db,
      kepala,
      (await readClosedPeriods(db))[0]?.closingId ?? "",
      START_PARAMS,
    );
    if (tab === "refused") throw new Error("Kepala Unit was refused.");
    expect(tab.list.rows).toHaveLength(GRADE_LIST_PAGE_SIZE);
    expect(tab.list.matching).toBe(grades.rows.length);
  });
});
