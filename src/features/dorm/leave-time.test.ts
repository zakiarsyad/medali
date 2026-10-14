import { describe, expect, it } from "vitest";
import {
  campusTimeOf,
  hoursBetween,
  hoursWords,
  isOvernight,
  momentOf,
} from "./leave-time";

describe("momentOf", () => {
  it("reads a time on campus as the moment it is, seven hours ahead of UTC", () => {
    expect(momentOf("2026-10-14T19:30")?.toISOString()).toBe(
      "2026-10-14T12:30:00.000Z",
    );
  });

  it.each([
    "",
    "2026-10-14",
    "2026-10-14 19:30",
    "2026-10-14T24:00",
    "2026-10-14T19:60",
    "2026-02-30T10:00",
    "2026-10-14T19:30:00",
  ])("refuses %j", (sent) => {
    expect(momentOf(sent)).toBeNull();
  });
});

describe("campusTimeOf", () => {
  it("writes a moment in campus time, as the form does", () => {
    expect(campusTimeOf(new Date("2026-10-14T17:30:00Z"))).toBe(
      "2026-10-15T00:30",
    );
  });
});

describe("the length of a leave", () => {
  const start = new Date("2026-10-14T02:00:00Z");

  it("is counted in hours, and said with a decimal comma", () => {
    const end = new Date("2026-10-14T03:30:00Z");

    expect(hoursBetween(start, end)).toBe(1.5);
    expect(hoursWords(1.5)).toBe("1,5 jam");
    expect(hoursWords(7)).toBe("7 jam");
  });

  it("is overnight when it ends on another day on campus, also at midnight", () => {
    expect(isOvernight(start, new Date("2026-10-14T16:59:00Z"))).toBe(false);
    expect(isOvernight(start, new Date("2026-10-14T17:00:00Z"))).toBe(true);
  });
});
