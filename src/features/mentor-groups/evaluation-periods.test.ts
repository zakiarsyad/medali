import { describe, expect, it } from "vitest";
import {
  evaluationPeriods,
  heldDuring,
  periodsHeldSince,
} from "./evaluation-periods";

const PERIODS = [
  { id: "genap-2025", startsOn: "2026-02-01" },
  { id: "ganjil-2026", startsOn: "2026-08-01" },
  { id: "ganjil-2025", startsOn: "2025-08-01" },
  { id: "genap-2026", startsOn: "2027-02-01" },
];

function ids(periods: { id: string }[]): string[] {
  return periods.map((period) => period.id);
}

describe("evaluationPeriods", () => {
  it("offers the running period first, then the one before it", () => {
    expect(ids(evaluationPeriods(PERIODS, "2026-10-13"))).toEqual([
      "ganjil-2026",
      "genap-2025",
    ]);
  });

  it("offers no period that has not started, and none older than the one before", () => {
    const offered = ids(evaluationPeriods(PERIODS, "2026-10-13"));

    expect(offered).not.toContain("genap-2026");
    expect(offered).not.toContain("ganjil-2025");
  });

  it("offers only the running period when none came before it", () => {
    expect(ids(evaluationPeriods(PERIODS, "2025-09-01"))).toEqual([
      "ganjil-2025",
    ]);
  });

  it("offers nothing on a day before the first period, or without periods", () => {
    expect(evaluationPeriods(PERIODS, "2025-07-31")).toEqual([]);
    expect(evaluationPeriods([], "2026-10-13")).toEqual([]);
  });
});

describe("heldDuring and periodsHeldSince", () => {
  const BEFORE = { id: "genap-2025", endsOn: "2026-07-31" };
  const RUNNING = { id: "ganjil-2026", endsOn: "2027-01-31" };

  it("counts a period for a mentor who took the group before it began, or inside it", () => {
    expect(heldDuring(BEFORE, "2025-09-01")).toBe(true);
    expect(heldDuring(BEFORE, "2026-05-10")).toBe(true);
  });

  it("counts the last day of a period, and not the day after", () => {
    expect(heldDuring(BEFORE, "2026-07-31")).toBe(true);
    expect(heldDuring(BEFORE, "2026-08-01")).toBe(false);
  });

  it("keeps both periods for a mentor who started inside the one before", () => {
    expect(periodsHeldSince([RUNNING, BEFORE], "2026-05-10")).toEqual([
      RUNNING,
      BEFORE,
    ]);
  });

  it("keeps only the running period for a mentor who took the group in it", () => {
    expect(periodsHeldSince([RUNNING, BEFORE], "2026-09-15")).toEqual([
      RUNNING,
    ]);
  });

  it("keeps none for a mentor whose first day comes after both", () => {
    expect(periodsHeldSince([RUNNING, BEFORE], "2027-02-01")).toEqual([]);
  });
});
