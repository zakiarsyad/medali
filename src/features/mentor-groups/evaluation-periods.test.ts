import { describe, expect, it } from "vitest";
import { evaluationPeriods } from "./evaluation-periods";

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
