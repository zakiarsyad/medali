import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { violationStatus } from "@/features/dorm/violation-status";
import {
  nextAnnouncement,
  SAMPLE_VIOLATION_RESIDENTS,
  sampleDormViolations,
} from "./sample-dorm-violations";

// 10:00 on campus on 14 October 2026.
const MORNING = new Date("2026-10-14T03:00:00Z");
// 20:30 on campus on that day.
const EVENING = new Date("2026-10-14T13:30:00Z");

describe("sampleDormViolations", () => {
  it.each([MORNING, EVENING])(
    "has violations waiting, in Masa advokasi and gone up to Pengelola Asrama at %s",
    (now) => {
      const shown = sampleDormViolations(now).filter(
        (violation) => !violation.isCancelled,
      );
      const statuses = new Set(
        shown.map((violation) => violationStatus(violation.announcedAt, now)),
      );

      expect([...statuses].sort()).toEqual([
        "appeal",
        "escalated",
        "scheduled",
      ]);
    },
  );

  it("cancels only a violation that waits for its announcement", () => {
    const cancelled = sampleDormViolations(MORNING).filter(
      (violation) => violation.isCancelled,
    );

    expect(cancelled).toHaveLength(1);
    for (const violation of cancelled) {
      expect(violation.announcedAt.getTime()).toBeGreaterThan(
        MORNING.getTime(),
      );
    }
  });

  it("never has a violation day after today, or an announcement before its day", () => {
    for (const now of [MORNING, EVENING]) {
      for (const violation of sampleDormViolations(now)) {
        expect(violation.day <= campusDay(now)).toBe(true);
        expect(campusDay(violation.announcedAt) >= violation.day).toBe(true);
      }
    }
  });

  it("names only the sample residents it is spread over, one of them more than once a day", () => {
    const violations = sampleDormViolations(MORNING);

    for (const violation of violations) {
      expect(violation.resident).toBeLessThan(SAMPLE_VIOLATION_RESIDENTS);
    }
    const ofFirst = violations.filter((violation) => violation.resident === 0);
    expect(ofFirst.length).toBeGreaterThan(3);
  });

  it("has one Hukuman lainnya, which says what it is", () => {
    const other = sampleDormViolations(MORNING).filter(
      (violation) => violation.punishment === "other",
    );

    expect(other).toHaveLength(1);
    expect(other[0]?.otherPunishment).not.toBe("");
  });
});

describe("nextAnnouncement", () => {
  it("is 21:00 today while it is more than an hour away", () => {
    expect(nextAnnouncement(MORNING)).toEqual(new Date("2026-10-14T14:00:00Z"));
  });

  it("is 21:00 tomorrow once today's is less than an hour away", () => {
    expect(nextAnnouncement(EVENING)).toEqual(new Date("2026-10-15T14:00:00Z"));
  });
});
