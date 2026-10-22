// Sample Tahun akademik of this file: 5130 to 5130.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestPeriods,
} from "@/features/activities/test-records";
import { chosenClosed, readClosedPeriods } from "./closed-semesters";
import { keepClosing } from "./keep-closing";
import { STARTING_SCHEME } from "./scheme-ids";

const inTestDatabase = withTestDatabase();

describe("readClosedPeriods", () => {
  it("gives every closed period, newest first, and no period that is not closed", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 5130);
      const kepala = await addTestActor(db, "Kepala Uji Pilih Semester", [
        "head_of_unit",
      ]);
      expect(await readClosedPeriods(db)).toEqual([]);
      for (const periodId of [periods.oddId, periods.evenId]) {
        await keepClosing(db, {
          periodId,
          closedBy: kepala.id,
          scheme: STARTING_SCHEME,
          rows: [],
        });
      }

      const closed = await readClosedPeriods(db);

      expect(closed.map((each) => each.period)).toEqual([
        { id: periods.evenId, startYear: 5130, term: "even" },
        { id: periods.oddId, startYear: 5130, term: "odd" },
      ]);
      expect(closed[0]?.closedAt).toBeInstanceOf(Date);
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
