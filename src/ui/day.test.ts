import { describe, expect, it } from "vitest";
import { shownDay, shownMoment } from "./day";

describe("shownDay", () => {
  it("shows a stored day the way the screens write a day", () => {
    expect(shownDay("2026-08-01")).toBe("1 Agu 2026");
    expect(shownDay("2027-01-31")).toBe("31 Jan 2027");
  });
});

describe("shownMoment", () => {
  it("shows a moment with its day and its time on campus", () => {
    expect(shownMoment(new Date("2026-10-11T07:05:00Z"))).toBe(
      "11 Okt 2026, 14.05",
    );
  });

  it("shows the day it is on campus, not where the server runs", () => {
    expect(shownMoment(new Date("2026-10-11T18:30:00Z"))).toBe(
      "12 Okt 2026, 01.30",
    );
  });
});
