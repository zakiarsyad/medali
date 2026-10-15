import { describe, expect, it } from "vitest";
import {
  PLACE_LENGTH,
  parseCallSchedule,
  SCHEDULE_IN_PAST,
  SCHEDULE_INCOMPLETE,
  SCHEDULE_NOT_KNOWN,
  SCHEDULE_TOO_FAR,
} from "./warning-input";

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

function schedule(more: Record<string, unknown> = {}) {
  return parseCallSchedule(
    {
      day: "2026-10-21",
      time: "16:00",
      place: "  Kantor Pengelola Asrama ",
      ...more,
    },
    NOW,
  );
}

describe("parseCallSchedule", () => {
  it("takes a whole schedule to come, with Tempat without the spaces around it", () => {
    expect(schedule()).toEqual({
      ok: true,
      value: {
        day: "2026-10-21",
        time: "16:00",
        place: "Kantor Pengelola Asrama",
      },
    });
    expect(schedule({ day: "2026-10-20", time: "10:01" }).ok).toBe(true);
  });

  it("refuses an empty field, or one that is no text", () => {
    for (const empty of [{ day: "" }, { time: "" }, { place: "   " }]) {
      expect(schedule(empty)).toEqual({
        ok: false,
        error: SCHEDULE_INCOMPLETE,
      });
    }
    expect(schedule({ place: 7 })).toEqual({
      ok: false,
      error: SCHEDULE_INCOMPLETE,
    });
  });

  it("refuses a past day, or an hour of today already gone", () => {
    expect(schedule({ day: "2026-10-19" })).toEqual({
      ok: false,
      error: SCHEDULE_IN_PAST,
    });
    expect(schedule({ day: "2026-10-20", time: "10:00" })).toEqual({
      ok: false,
      error: SCHEDULE_IN_PAST,
    });
  });

  it("refuses a day more than 30 days ahead", () => {
    expect(schedule({ day: "2026-11-19" }).ok).toBe(true);
    expect(schedule({ day: "2026-11-20" })).toEqual({
      ok: false,
      error: SCHEDULE_TOO_FAR,
    });
  });

  it("refuses a day or an hour that does not exist", () => {
    for (const wrong of [
      { day: "2026-02-30" },
      { day: "besok" },
      { time: "25:00" },
      { time: "16.00" },
    ]) {
      expect(schedule(wrong)).toEqual({ ok: false, error: SCHEDULE_NOT_KNOWN });
    }
  });

  it("takes Tempat of 3 to 100 letters only", () => {
    expect(schedule({ place: "Aul" }).ok).toBe(true);
    expect(schedule({ place: "Au" })).toEqual({
      ok: false,
      error: PLACE_LENGTH,
    });
    expect(schedule({ place: "a".repeat(100) }).ok).toBe(true);
    expect(schedule({ place: "a".repeat(101) })).toEqual({
      ok: false,
      error: PLACE_LENGTH,
    });
  });
});
