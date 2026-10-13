import { describe, expect, it } from "vitest";
import { campusTime } from "./campus-clock";

describe("campusTime", () => {
  it("gives the hour and the minute with two digits each", () => {
    expect(campusTime(new Date("2026-10-13T00:30:00Z"))).toBe("07:30");
    expect(campusTime(new Date("2026-10-13T02:05:59Z"))).toBe("09:05");
  });

  it("counts the hour in campus time, seven hours ahead of UTC", () => {
    expect(campusTime(new Date("2026-10-13T16:59:00Z"))).toBe("23:59");
    expect(campusTime(new Date("2026-10-13T17:00:00Z"))).toBe("00:00");
  });

  it("sorts as text the way the clock runs", () => {
    const morning = campusTime(new Date("2026-10-13T02:00:00Z"));
    const evening = campusTime(new Date("2026-10-13T12:00:00Z"));

    expect(morning < evening).toBe(true);
  });
});
