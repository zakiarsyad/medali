import { describe, expect, it } from "vitest";
import { nextOccurrences, takesPlaceOn, takingPlaceOn } from "./activity-days";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

// 14 October 2026 is a Wednesday.
const WEDNESDAY = "2026-10-14";
const WEEKLY = { ...TEST_ROW, pattern: "weekly" as const, weekdays: [3, 6] };
const MONTHLY = { ...TEST_ROW, pattern: "monthly" as const, monthDay: 1 };

describe("takesPlaceOn for a daily activity", () => {
  it("takes place every day from Berlaku mulai on", () => {
    expect(takesPlaceOn(TEST_ROW, "2026-07-31")).toBe(false);
    expect(takesPlaceOn(TEST_ROW, "2026-08-01")).toBe(true);
    expect(takesPlaceOn(TEST_ROW, WEDNESDAY)).toBe(true);
    expect(takesPlaceOn(TEST_ROW, "2031-02-28")).toBe(true);
  });

  it("stops after Berlaku sampai, which is its last day", () => {
    const ending = { ...TEST_ROW, endsOn: WEDNESDAY };

    expect(takesPlaceOn(ending, WEDNESDAY)).toBe(true);
    expect(takesPlaceOn(ending, "2026-10-15")).toBe(false);
  });

  it("skips a day off, and only that day", () => {
    const withDayOff = { ...TEST_ROW, daysOff: [WEDNESDAY] };

    expect(takesPlaceOn(withDayOff, "2026-10-13")).toBe(true);
    expect(takesPlaceOn(withDayOff, WEDNESDAY)).toBe(false);
    expect(takesPlaceOn(withDayOff, "2026-10-15")).toBe(true);
  });
});

describe("takesPlaceOn for a weekly activity", () => {
  it("takes place on its days of the week only", () => {
    expect(takesPlaceOn(WEEKLY, "2026-10-13")).toBe(false);
    expect(takesPlaceOn(WEEKLY, WEDNESDAY)).toBe(true);
    expect(takesPlaceOn(WEEKLY, "2026-10-16")).toBe(false);
    expect(takesPlaceOn(WEEKLY, "2026-10-17")).toBe(true);
    expect(takesPlaceOn(WEEKLY, "2026-10-18")).toBe(false);
  });

  it("counts Minggu as day 0", () => {
    const sundays = { ...WEEKLY, weekdays: [0] };

    expect(takesPlaceOn(sundays, "2026-10-18")).toBe(true);
    expect(takesPlaceOn(sundays, "2026-10-17")).toBe(false);
  });
});

describe("takesPlaceOn for a monthly activity", () => {
  it("takes place on its date of every month", () => {
    expect(takesPlaceOn(MONTHLY, "2026-10-01")).toBe(true);
    expect(takesPlaceOn(MONTHLY, "2026-11-01")).toBe(true);
    expect(takesPlaceOn(MONTHLY, "2026-10-02")).toBe(false);
    expect(takesPlaceOn(MONTHLY, "2026-10-31")).toBe(false);
  });

  it("takes place on the 28th in February too", () => {
    const late = { ...MONTHLY, monthDay: 28 };

    expect(takesPlaceOn(late, "2027-02-28")).toBe(true);
    expect(takesPlaceOn(late, "2027-02-27")).toBe(false);
  });
});

describe("takesPlaceOn for a one-off activity", () => {
  it("takes place on its date only", () => {
    expect(takesPlaceOn(TEST_ONE_OFF, "2026-10-13")).toBe(false);
    expect(takesPlaceOn(TEST_ONE_OFF, WEDNESDAY)).toBe(true);
    expect(takesPlaceOn(TEST_ONE_OFF, "2026-10-15")).toBe(false);
  });
});

describe("takesPlaceOn for a version of an activity", () => {
  it("takes place only on the days the version is shown for", () => {
    const earlier = { ...TEST_ROW, shownUntil: "2026-10-13" };
    const later = { ...TEST_ROW, shownFrom: WEDNESDAY };

    expect(takesPlaceOn(earlier, "2026-10-13")).toBe(true);
    expect(takesPlaceOn(earlier, WEDNESDAY)).toBe(false);
    expect(takesPlaceOn(later, "2026-10-13")).toBe(false);
    expect(takesPlaceOn(later, WEDNESDAY)).toBe(true);
  });

  it("still takes place on the days before a removed activity stopped, and on none from then on", () => {
    const removed = { ...TEST_ROW, removedFrom: WEDNESDAY };

    expect(takesPlaceOn(removed, "2026-10-13")).toBe(true);
    expect(takesPlaceOn(removed, WEDNESDAY)).toBe(false);
    expect(takesPlaceOn(removed, "2026-12-01")).toBe(false);
  });
});

describe("takingPlaceOn", () => {
  it("gives the activities of a day by their first hour, then by name", () => {
    const evening = {
      ...TEST_ROW,
      name: "Belajar malam uji",
      startTime: "19:30",
    };
    const sameHour = { ...TEST_ONE_OFF, name: "Bakti uji", startTime: "19:30" };
    const rows = [evening, TEST_ROW, sameHour, MONTHLY];

    const names = takingPlaceOn(rows, WEDNESDAY).map((row) => row.name);

    expect(names).toEqual(["Apel pagi uji", "Bakti uji", "Belajar malam uji"]);
  });
});

describe("nextOccurrences", () => {
  it("gives the next six after a day, the soonest first, and none of the day itself", () => {
    const next = nextOccurrences([TEST_ROW, WEEKLY], "2026-10-13", 6);

    expect(next.map(({ day }) => day)).toEqual([
      WEDNESDAY,
      WEDNESDAY,
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-17",
    ]);
  });

  it("finds a one-off activity months ahead when nothing comes sooner", () => {
    const far = {
      ...TEST_ONE_OFF,
      startsOn: "2027-03-01",
      endsOn: "2027-03-01",
    };

    const next = nextOccurrences([far], WEDNESDAY, 6);

    expect(next).toEqual([{ day: "2027-03-01", activity: far }]);
  });

  it("gives none when nothing takes place within a year", () => {
    const ended = { ...TEST_ROW, endsOn: "2026-10-01" };

    expect(nextOccurrences([ended], WEDNESDAY, 6)).toEqual([]);
  });
});
