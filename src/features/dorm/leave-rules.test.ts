import { describe, expect, it } from "vitest";
import type { LeaveKind } from "./leave-ids";
import {
  fitsKind,
  lengthWords,
  OUTING_DOES_NOT_FIT,
  TOO_FAR_AHEAD,
  TOO_LONG,
  timeProblems,
} from "./leave-rules";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

// 10:00 on campus on 14 October 2026.
const NOW = on("2026-10-14T10:00");

function times(kind: LeaveKind, start: string, end: string) {
  return { kind, start: on(start), end: on(end) };
}

describe("timeProblems", () => {
  it("finds nothing wrong with Izin pesiar of 7 hours later today", () => {
    expect(
      timeProblems(
        times("outing", "2026-10-14T11:00", "2026-10-14T18:00"),
        NOW,
      ),
    ).toEqual([]);
  });

  it("refuses an end that is not after the start, in the words of each kind", () => {
    expect(
      timeProblems(
        times("outing", "2026-10-15T11:00", "2026-10-15T11:00"),
        NOW,
      ),
    ).toEqual(["Waktu kembali harus setelah waktu berangkat."]);
    expect(
      timeProblems(
        times("skip_activities", "2026-10-15T11:00", "2026-10-15T10:00"),
        NOW,
      ),
    ).toEqual(["Jam selesai harus setelah jam mulai."]);
  });

  it("refuses a start that has passed, also by one minute", () => {
    expect(
      timeProblems(
        times("special", "2026-10-14T09:59", "2026-10-15T10:00"),
        NOW,
      ),
    ).toEqual(["Waktu berangkat sudah lewat."]);
    expect(
      timeProblems(
        times("skip_activities", "2026-10-14T09:59", "2026-10-14T12:00"),
        NOW,
      ),
    ).toEqual(["Jam mulai sudah lewat."]);
  });

  it("refuses Izin pesiar of 12 hours or more, and one that goes overnight", () => {
    expect(
      timeProblems(
        times("outing", "2026-10-14T11:00", "2026-10-14T23:00"),
        NOW,
      ),
    ).toEqual([OUTING_DOES_NOT_FIT]);
    expect(
      timeProblems(
        times("outing", "2026-10-14T22:00", "2026-10-15T01:00"),
        NOW,
      ),
    ).toEqual([OUTING_DOES_NOT_FIT]);
  });

  it("lets Izin pesiar last just under 12 hours", () => {
    expect(
      timeProblems(
        times("outing", "2026-10-14T11:00", "2026-10-14T22:59"),
        NOW,
      ),
    ).toEqual([]);
  });

  it("lets Izin khusus and ITMK go overnight, up to 30 days", () => {
    expect(
      timeProblems(
        times("special", "2026-10-15T08:00", "2026-11-14T08:00"),
        NOW,
      ),
    ).toEqual([]);
    expect(
      timeProblems(
        times("skip_activities", "2026-10-15T08:00", "2026-10-16T08:00"),
        NOW,
      ),
    ).toEqual([]);
    expect(
      timeProblems(
        times("special", "2026-10-15T08:00", "2026-11-14T08:01"),
        NOW,
      ),
    ).toEqual([TOO_LONG]);
  });

  it("refuses a start more than a year ahead", () => {
    expect(
      timeProblems(
        times("special", "2027-10-16T08:00", "2027-10-17T08:00"),
        NOW,
      ),
    ).toEqual([TOO_FAR_AHEAD]);
  });

  it("names every problem at once", () => {
    expect(
      timeProblems(
        times("outing", "2026-10-13T08:00", "2026-10-14T08:00"),
        NOW,
      ),
    ).toEqual(["Waktu berangkat sudah lewat.", OUTING_DOES_NOT_FIT]);
  });
});

describe("fitsKind", () => {
  it("holds Izin pesiar to under 12 hours on one day, and no other kind", () => {
    const long = ["2026-10-14T08:00", "2026-10-14T21:00"] as const;

    expect(fitsKind(times("outing", ...long))).toBe(false);
    expect(fitsKind(times("special", ...long))).toBe(true);
    expect(fitsKind(times("skip_activities", ...long))).toBe(true);
  });
});

describe("lengthWords", () => {
  it("says the length, and that it goes overnight", () => {
    expect(lengthWords(on("2026-10-14T09:00"), on("2026-10-14T16:30"))).toBe(
      "Durasi 7,5 jam.",
    );
    expect(lengthWords(on("2026-10-14T15:00"), on("2026-10-15T17:00"))).toBe(
      "Durasi 26 jam, melewati malam.",
    );
  });
});
