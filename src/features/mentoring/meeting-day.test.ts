import { describe, expect, it } from "vitest";
import { lastMeetingDay, meetingDayFault } from "./meeting-day";

const PERIOD = { startsOn: "2026-08-01", endsOn: "2027-01-31" };
const TODAY = "2026-10-13";

describe("meetingDayFault", () => {
  it.each(["2026-08-01", "2026-09-15", "2026-10-13"])(
    "takes %s, a day of the running period up to today",
    (heldOn) => {
      expect(meetingDayFault(heldOn, PERIOD, TODAY)).toBeNull();
    },
  );

  it("refuses a day after today, and says so", () => {
    const fault = meetingDayFault("2026-10-14", PERIOD, TODAY);

    expect(fault).toContain("setelah hari ini");
  });

  it("refuses a day before the running period, and names the days of the period", () => {
    const fault = meetingDayFault("2026-07-31", PERIOD, TODAY);

    expect(fault).toContain("semester berjalan");
    expect(fault).toContain("1 Agu 2026");
    expect(fault).toContain("31 Jan 2027");
  });

  it("refuses a day after the last day of the period, also once today is later", () => {
    const afterPeriod = "2027-02-10";

    expect(meetingDayFault("2027-02-01", PERIOD, afterPeriod)).toContain(
      "semester berjalan",
    );
    expect(meetingDayFault("2027-01-31", PERIOD, afterPeriod)).toBeNull();
  });
});

describe("lastMeetingDay", () => {
  it("is today while the period runs", () => {
    expect(lastMeetingDay(PERIOD, TODAY)).toBe(TODAY);
  });

  it("is the last day of the period once today is later", () => {
    expect(lastMeetingDay(PERIOD, "2027-02-10")).toBe("2027-01-31");
  });
});
