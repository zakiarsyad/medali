import { describe, expect, it } from "vitest";
import { coveredActivities, coveredWords, coversActivity } from "./leave-cover";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

function span(start: string, end: string) {
  return { start: on(start), end: on(end) };
}

const EVENING = { day: "2026-10-14", startTime: "19:00", endTime: "21:00" };

describe("coversActivity", () => {
  it("covers an activity whose time overlaps the leave, also by a minute", () => {
    expect(
      coversActivity(span("2026-10-14T18:00", "2026-10-14T19:01"), EVENING),
    ).toBe(true);
    expect(
      coversActivity(span("2026-10-14T20:59", "2026-10-14T23:00"), EVENING),
    ).toBe(true);
    expect(
      coversActivity(span("2026-10-14T19:30", "2026-10-14T20:00"), EVENING),
    ).toBe(true);
  });

  it("does not cover an activity that starts as the leave ends, or ends as it starts", () => {
    expect(
      coversActivity(span("2026-10-14T13:00", "2026-10-14T19:00"), EVENING),
    ).toBe(false);
    expect(
      coversActivity(span("2026-10-14T21:00", "2026-10-14T23:00"), EVENING),
    ).toBe(false);
  });
});

describe("coveredActivities", () => {
  const ROWS = [TEST_ROW, TEST_ONE_OFF];

  it("lists each day's activities in the time of an overnight leave, the earliest first", () => {
    const covered = coveredActivities(
      ROWS,
      "dana_rakca",
      span("2026-10-14T18:00", "2026-10-15T07:00"),
    );

    expect(covered.map((each) => `${each.day} ${each.name}`)).toEqual([
      "2026-10-14 Malam keakraban uji",
      "2026-10-15 Apel pagi uji",
    ]);
  });

  it("lists only the activities whose Peserta covers the dorm", () => {
    const forMen = { ...TEST_ONE_OFF, audience: "men" as const };

    expect(
      coveredActivities(
        [forMen],
        "dana_rakca",
        span("2026-10-14T18:00", "2026-10-14T22:00"),
      ),
    ).toEqual([]);
  });

  it("names an activity by its name, day and hour", () => {
    const [first] = coveredActivities(
      ROWS,
      "dana_rakca",
      span("2026-10-14T18:00", "2026-10-14T22:00"),
    );

    expect(first && coveredWords(first)).toBe(
      "Malam keakraban uji 14 Okt 2026 19:00",
    );
  });
});
