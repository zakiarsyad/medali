import { describe, expect, it } from "vitest";
import { runningPeriodOn } from "./running-period";

const EVEN_2025 = { startsOn: "2026-02-01", endsOn: "2026-07-15" };
const ODD_2026 = { startsOn: "2026-08-01", endsOn: "2027-01-31" };
const PERIODS = [ODD_2026, EVEN_2025];

describe("runningPeriodOn", () => {
  it.each([
    ["its first day", "2026-08-01"],
    ["a day inside it", "2026-10-12"],
    ["its last day", "2027-01-31"],
  ])("gives the period on %s", (_what, day) => {
    expect(runningPeriodOn(PERIODS, day)).toBe(ODD_2026);
  });

  it("keeps the period that ended last on a day between two periods", () => {
    expect(runningPeriodOn(PERIODS, "2026-07-16")).toBe(EVEN_2025);
    expect(runningPeriodOn(PERIODS, "2026-07-31")).toBe(EVEN_2025);
  });

  it("keeps the last period on a day after it ended", () => {
    expect(runningPeriodOn(PERIODS, "2027-02-01")).toBe(ODD_2026);
    expect(runningPeriodOn(PERIODS, "2031-05-20")).toBe(ODD_2026);
  });

  it("answers an earlier date by the same rule as today", () => {
    expect(runningPeriodOn(PERIODS, "2026-03-10")).toBe(EVEN_2025);
  });

  it("gives the same answer whatever the order of the periods", () => {
    expect(runningPeriodOn([EVEN_2025, ODD_2026], "2026-10-12")).toBe(ODD_2026);
  });

  it("says there is no period on a day before the first one", () => {
    expect(runningPeriodOn(PERIODS, "2026-01-31")).toBeNull();
  });

  it("says there is no period when none is stored", () => {
    expect(runningPeriodOn([], "2026-10-12")).toBeNull();
  });
});
