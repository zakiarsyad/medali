import { describe, expect, it } from "vitest";
import {
  appealEndOf,
  lastEscalatedAnnouncement,
  violationStatus,
} from "./violation-status";

// 21:00 on campus on 12 October 2026.
const ANNOUNCED = new Date("2026-10-12T14:00:00Z");
const MINUTE_MS = 60 * 1000;

function minutesLater(minutes: number): Date {
  return new Date(ANNOUNCED.getTime() + minutes * MINUTE_MS);
}

describe("appealEndOf", () => {
  it("is 3 hours after the announcement", () => {
    expect(appealEndOf(ANNOUNCED)).toEqual(new Date("2026-10-12T17:00:00Z"));
  });
});

describe("lastEscalatedAnnouncement", () => {
  it("is 3 hours before a moment, when what was announced then goes up", () => {
    const at = lastEscalatedAnnouncement(minutesLater(180));

    expect(at).toEqual(ANNOUNCED);
    expect(violationStatus(at, minutesLater(180))).toBe("escalated");
  });
});

describe("violationStatus", () => {
  it("is Terjadwal before the announcement hour", () => {
    expect(violationStatus(ANNOUNCED, minutesLater(-1))).toBe("scheduled");
  });

  it("is Masa advokasi from the announcement hour itself", () => {
    expect(violationStatus(ANNOUNCED, ANNOUNCED)).toBe("appeal");
    expect(violationStatus(ANNOUNCED, minutesLater(179))).toBe("appeal");
  });

  it("is Naik ke Pengelola from 3 hours after the announcement", () => {
    expect(violationStatus(ANNOUNCED, minutesLater(180))).toBe("escalated");
    expect(violationStatus(ANNOUNCED, minutesLater(60 * 24 * 30))).toBe(
      "escalated",
    );
  });
});
