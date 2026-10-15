import { describe, expect, it } from "vitest";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { periodDays } from "./violation-periods";

const PERIODS = [
  { id: "even-2027", startsOn: "2027-02-01" },
  { id: "odd-2026", startsOn: "2026-08-01" },
  { id: "even-2026", startsOn: "2026-02-01" },
];

describe("periodDays", () => {
  it("runs from the first day of a period up to the first day of the next one", () => {
    expect(periodDays(PERIODS, "odd-2026")).toEqual({
      from: "2026-08-01",
      before: "2027-02-01",
    });
  });

  it("has no end for the period that started last", () => {
    expect(periodDays(PERIODS, "even-2027")).toEqual({
      from: "2027-02-01",
      before: null,
    });
  });

  it("is nothing for a key of no period", () => {
    expect(periodDays(PERIODS, "odd-2030")).toBeNull();
  });

  it("holds exactly the days whose running period is that period", () => {
    const days = ["2026-07-31", "2026-08-01", "2027-01-31", "2027-02-01"];
    for (const day of days) {
      const running = runningPeriodOn(PERIODS, day);
      for (const period of PERIODS) {
        const range = periodDays(PERIODS, period.id);
        const holds =
          range !== null &&
          day >= range.from &&
          (range.before === null || day < range.before);
        expect(holds).toBe(running?.id === period.id);
      }
    }
  });
});
