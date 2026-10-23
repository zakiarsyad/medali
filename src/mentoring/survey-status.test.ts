import { describe, expect, it } from "vitest";
import {
  runsWith,
  SURVEY_STATUS_TITLES,
  surveyNumbersDay,
  surveyStatus,
} from "./survey-status";

const PERIOD = {
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  closedAt: null,
};

describe("surveyStatus", () => {
  it.each([
    ["2026-10-12", "scheduled"],
    ["2026-09-01", "scheduled"],
    ["2026-10-13", "open"],
    ["2026-10-20", "open"],
    ["2026-10-27", "open"],
    ["2026-10-28", "ended"],
    ["2027-01-01", "ended"],
  ] as const)("on %s the period is %s", (today, status) => {
    expect(surveyStatus(PERIOD, today)).toBe(status);
  });

  it("changes by itself with the date: Terjadwal, then Dibuka, then Berakhir", () => {
    const days = ["2026-10-12", "2026-10-13", "2026-10-27", "2026-10-28"];

    expect(days.map((day) => surveyStatus(PERIOD, day))).toEqual([
      "scheduled",
      "open",
      "open",
      "ended",
    ]);
  });

  it.each(["2026-10-12", "2026-10-20", "2026-10-28"])(
    "is Ditutup on %s once it is closed by hand, whatever the date",
    (today) => {
      const closed = { ...PERIOD, closedAt: new Date("2026-10-15T03:00:00Z") };

      expect(surveyStatus(closed, today)).toBe("closed");
    },
  );

  it("is Dibuka on the one day of a period of one day", () => {
    const oneDay = { ...PERIOD, endsOn: PERIOD.startsOn };

    expect(surveyStatus(oneDay, "2026-10-12")).toBe("scheduled");
    expect(surveyStatus(oneDay, "2026-10-13")).toBe("open");
    expect(surveyStatus(oneDay, "2026-10-14")).toBe("ended");
  });
});

describe("surveyNumbersDay", () => {
  it("is today while the period runs", () => {
    expect(surveyNumbersDay(PERIOD, "2026-10-12")).toBe("2026-10-12");
    expect(surveyNumbersDay(PERIOD, "2026-10-20")).toBe("2026-10-20");
    expect(surveyNumbersDay(PERIOD, "2026-10-27")).toBe("2026-10-27");
  });

  it("stays the last day once the period is Berakhir", () => {
    expect(surveyNumbersDay(PERIOD, "2026-10-28")).toBe("2026-10-27");
    expect(surveyNumbersDay(PERIOD, "2027-03-01")).toBe("2026-10-27");
  });

  it("stays the day on campus it was closed by hand once it is Ditutup", () => {
    // 20:00 in UTC is the next morning on campus.
    const closed = { ...PERIOD, closedAt: new Date("2026-10-15T20:00:00Z") };

    expect(surveyNumbersDay(closed, "2026-10-20")).toBe("2026-10-16");
    expect(surveyNumbersDay(closed, "2027-03-01")).toBe("2026-10-16");
  });
});

describe("runsWith", () => {
  it("counts Terjadwal and Dibuka as running, Berakhir and Ditutup as over", () => {
    expect(runsWith("scheduled")).toBe(true);
    expect(runsWith("open")).toBe(true);
    expect(runsWith("ended")).toBe(false);
    expect(runsWith("closed")).toBe(false);
  });
});

describe("SURVEY_STATUS_TITLES", () => {
  it("names each status as the screens show it", () => {
    expect(SURVEY_STATUS_TITLES).toEqual({
      scheduled: "Terjadwal",
      open: "Dibuka",
      ended: "Berakhir",
      closed: "Ditutup",
    });
  });
});
