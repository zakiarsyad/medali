import { describe, expect, it } from "vitest";
import {
  appealEndOf,
  lastEscalatedAnnouncement,
  recordStatus,
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
    expect(violationStatus(at, null, minutesLater(180))).toBe("escalated");
  });
});

describe("violationStatus", () => {
  it("is Terjadwal before the announcement hour", () => {
    expect(violationStatus(ANNOUNCED, null, minutesLater(-1))).toBe(
      "scheduled",
    );
  });

  it("is Masa advokasi from the announcement hour itself", () => {
    expect(violationStatus(ANNOUNCED, null, ANNOUNCED)).toBe("appeal");
    expect(violationStatus(ANNOUNCED, null, minutesLater(179))).toBe("appeal");
  });

  it("is Naik ke Pengelola from 3 hours after the announcement", () => {
    expect(violationStatus(ANNOUNCED, null, minutesLater(180))).toBe(
      "escalated",
    );
    expect(violationStatus(ANNOUNCED, null, minutesLater(60 * 24 * 30))).toBe(
      "escalated",
    );
  });

  it("is Advokasi diproses while its appeal waits, also long after 3 hours", () => {
    expect(violationStatus(ANNOUNCED, "waiting", minutesLater(30))).toBe(
      "appeal_waiting",
    );
    expect(
      violationStatus(ANNOUNCED, "waiting", minutesLater(60 * 24 * 30)),
    ).toBe("appeal_waiting");
  });

  it("is Advokasi diterima once its appeal is accepted, never going up", () => {
    expect(violationStatus(ANNOUNCED, "accepted", minutesLater(30))).toBe(
      "appeal_accepted",
    );
    expect(
      violationStatus(ANNOUNCED, "accepted", minutesLater(60 * 24 * 30)),
    ).toBe("appeal_accepted");
  });

  it("is Naik ke Pengelola once its appeal is rejected, also within the 3 hours", () => {
    expect(violationStatus(ANNOUNCED, "rejected", minutesLater(30))).toBe(
      "escalated",
    );
  });
});

describe("recordStatus", () => {
  it("is Dikurangi for a reduced violation, whatever the clock says", () => {
    expect(
      recordStatus(ANNOUNCED, null, minutesLater(240), minutesLater(300)),
    ).toBe("reduced");
    expect(
      recordStatus(ANNOUNCED, "rejected", minutesLater(60), minutesLater(90)),
    ).toBe("reduced");
  });

  it("is what violationStatus says for a violation not reduced", () => {
    expect(recordStatus(ANNOUNCED, null, null, minutesLater(30))).toBe(
      "appeal",
    );
    expect(recordStatus(ANNOUNCED, null, null, minutesLater(180))).toBe(
      "escalated",
    );
    expect(recordStatus(ANNOUNCED, "accepted", null, minutesLater(30))).toBe(
      "appeal_accepted",
    );
  });
});
