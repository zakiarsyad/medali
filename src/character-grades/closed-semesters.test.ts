// Sample Tahun akademik of this file: 5130 to 5130.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestPeriods,
} from "@/features/activities/test-records";
import { chosenClosed, readClosedPeriods } from "./closed-semesters";
import { keepClosing } from "./keep-closing";
import { type GradeScheme, STARTING_SCHEME } from "./scheme-ids";

const inTestDatabase = withTestDatabase();

const KEPT_SCHEME: GradeScheme = {
  weights: { attendance: 40, mentoring: 20, siku: 20, skpm: 20 },
  lowerLimits: { A: 90, B: 75, C: 60, D: 45 },
  passLetter: "C",
};

describe("readClosedPeriods", () => {
  it("gives every closed period, newest first, and no period that is not closed", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 5130);
      const kepala = await addTestActor(db, "Kepala Uji Pilih Semester", [
        "head_of_unit",
      ]);
      expect(await readClosedPeriods(db)).toEqual([]);
      const close = (periodId: string, scheme: GradeScheme) =>
        keepClosing(db, { periodId, closedBy: kepala.id, scheme, rows: [] });

      await close(periods.oddId, STARTING_SCHEME);
      const once = await readClosedPeriods(db);
      await close(periods.evenId, KEPT_SCHEME);
      const twice = await readClosedPeriods(db);

      expect(once.map((each) => each.period.id)).toEqual([periods.oddId]);
      expect(twice.map((each) => each.period)).toEqual([
        { id: periods.evenId, startYear: 5130, term: "even" },
        { id: periods.oddId, startYear: 5130, term: "odd" },
      ]);
      expect(twice[0]?.closedAt).toBeInstanceOf(Date);
      expect(twice.map((each) => each.scheme)).toEqual([
        KEPT_SCHEME,
        STARTING_SCHEME,
      ]);
    });
  });
});

describe("chosenClosed", () => {
  const closed = [
    { period: { id: "period-even" } },
    { period: { id: "period-odd" } },
  ];

  it("gives the closed period the address names", () => {
    expect(chosenClosed(closed, "period-odd")).toBe(closed[1]);
  });

  it("gives the running semester for a period that is not closed, or none", () => {
    expect(chosenClosed(closed, "period-running")).toBeNull();
    expect(chosenClosed(closed, null)).toBeNull();
    expect(chosenClosed([], "period-odd")).toBeNull();
  });
});
