import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import { DAYS_OFF_MAX } from "./activity-limits";
import { daysOffToKeep, stillToCome, TOO_MANY_DAYS_OFF } from "./days-off-kept";

const TODAY = "2026-10-14";

function daysFrom(first: string, count: number): string[] {
  return Array.from({ length: count }, (_, place) => daysAfter(first, place));
}

describe("daysOffToKeep", () => {
  it("keeps every stored day before today, whatever the form sends", () => {
    const kept = daysOffToKeep(["2026-10-01", "2026-10-20"], [], TODAY);

    expect(kept).toEqual({ ok: true, value: ["2026-10-01"] });
  });

  it("lets the form take off a day of today or later, and add a day of any date", () => {
    const kept = daysOffToKeep(
      ["2026-10-01", TODAY, "2026-10-20"],
      ["2026-10-21", "2026-09-30"],
      TODAY,
    );

    expect(kept).toEqual({
      ok: true,
      value: ["2026-09-30", "2026-10-01", "2026-10-21"],
    });
  });

  it("keeps a day sent and stored once", () => {
    const kept = daysOffToKeep(["2026-10-01"], ["2026-10-01"], TODAY);

    expect(kept).toEqual({ ok: true, value: ["2026-10-01"] });
  });

  it("counts only the days of today and later against the limit", () => {
    const past = daysFrom("2026-01-01", DAYS_OFF_MAX + 50);
    const coming = daysFrom(TODAY, DAYS_OFF_MAX);

    const kept = daysOffToKeep(past, coming, TODAY);

    expect(kept.ok).toBe(true);
    expect(daysOffToKeep(past, [...coming, "2027-12-31"], TODAY)).toEqual(
      TOO_MANY_DAYS_OFF,
    );
  });
});

describe("stillToCome", () => {
  it("gives the days of today and later", () => {
    expect(stillToCome(["2026-10-13", TODAY, "2026-10-15"], TODAY)).toEqual([
      TODAY,
      "2026-10-15",
    ]);
  });
});
