import { describe, expect, it } from "vitest";
import { activityState, STATE_WORDS } from "./activity-state";

const HELD = { day: "2026-10-14", startTime: "16:00", endTime: "17:30" };

describe("activityState", () => {
  it.each([
    ["2026-10-13", "23:59", "coming"],
    ["2026-10-13", "16:30", "coming"],
    ["2026-10-14", "00:00", "today_not_started"],
    ["2026-10-14", "15:59", "today_not_started"],
    ["2026-10-14", "16:00", "running"],
    ["2026-10-14", "17:30", "running"],
    ["2026-10-14", "17:31", "over"],
    ["2026-10-15", "00:00", "over"],
    ["2026-10-15", "16:30", "over"],
  ] as const)("on %s at %s it is %s", (day, time, state) => {
    expect(activityState(HELD, { day, time })).toBe(state);
  });

  it("runs all day for an activity from 00:00 to 23:59", () => {
    const allDay = { ...HELD, startTime: "00:00", endTime: "23:59" };

    expect(activityState(allDay, { day: HELD.day, time: "00:00" })).toBe(
      "running",
    );
    expect(activityState(allDay, { day: HELD.day, time: "23:59" })).toBe(
      "running",
    );
  });
});

describe("the words of a state", () => {
  it("are those the schedule shows, without the old labels of attendance by photo", () => {
    expect(STATE_WORDS).toEqual({
      coming: "Akan datang",
      today_not_started: "Hari ini, belum dimulai",
      running: "Berlangsung",
      over: "Selesai",
    });
  });
});
