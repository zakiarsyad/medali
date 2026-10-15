import { describe, expect, it } from "vitest";
import {
  PLACE_LENGTH,
  PROPOSAL_NOTE_TOO_LONG,
  parseCallSchedule,
  parseIssue,
  RESULT_LENGTH,
  RESULT_NEEDED,
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

describe("parseIssue", () => {
  const RESULT = "  Mahasiswa hadir dan mengakui pelanggarannya. ";

  function issue(result: unknown, proposalNote: unknown, level: 1 | 2 = 1) {
    return parseIssue({ result, proposalNote }, level);
  }

  it("takes Hasil klarifikasi of 10 letters or more without spaces around it", () => {
    expect(issue(RESULT, "")).toEqual({
      ok: true,
      value: {
        result: "Mahasiswa hadir dan mengakui pelanggarannya.",
        proposalNote: "",
      },
    });
    expect(issue("a".repeat(10), "").ok).toBe(true);
  });

  it("refuses Hasil klarifikasi that is empty, under 10 letters, or over 1,000", () => {
    expect(issue("  ", "")).toEqual({ ok: false, error: RESULT_NEEDED });
    expect(issue(42, "")).toEqual({ ok: false, error: RESULT_NEEDED });
    expect(issue("a".repeat(9), "")).toEqual({
      ok: false,
      error: RESULT_LENGTH,
    });
    expect(issue("a".repeat(1001), "")).toEqual({
      ok: false,
      error: RESULT_LENGTH,
    });
  });

  it("keeps the proposal note of SP 2 only, which may be empty, up to 1,000 letters", () => {
    expect(issue(RESULT, " Perlu ", 2)).toMatchObject({
      value: { proposalNote: "Perlu" },
    });
    expect(issue(RESULT, null, 2)).toMatchObject({
      value: { proposalNote: "" },
    });
    expect(issue(RESULT, "Perlu", 1)).toMatchObject({
      value: { proposalNote: "" },
    });
    expect(issue(RESULT, "a".repeat(1000), 2).ok).toBe(true);
    expect(issue(RESULT, "a".repeat(1001), 2)).toEqual({
      ok: false,
      error: PROPOSAL_NOTE_TOO_LONG,
    });
  });
});
