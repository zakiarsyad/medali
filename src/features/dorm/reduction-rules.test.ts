import { describe, expect, it } from "vitest";
import {
  REDUCTION_REASON_TOO_LONG,
  REDUCTION_REASON_TOO_SHORT,
  reductionReasonFault,
  reductionStanding,
} from "./reduction-rules";

// 21:00 on campus on 12 October 2026.
const ANNOUNCED = new Date("2026-10-12T14:00:00Z");
const HOUR_MS = 60 * 60 * 1000;

function hoursLater(hours: number): Date {
  return new Date(ANNOUNCED.getTime() + hours * HOUR_MS);
}

const GONE_UP = {
  announcedAt: ANNOUNCED,
  cancelledAt: null,
  reducedAt: null,
  appeal: null,
};

describe("reductionReasonFault", () => {
  it("takes 5 to 500 letters, not counting spaces around them", () => {
    expect(reductionReasonFault("  abcd  ")).toBe(REDUCTION_REASON_TOO_SHORT);
    expect(reductionReasonFault("abcde")).toBeNull();
    expect(reductionReasonFault("a".repeat(500))).toBeNull();
    expect(reductionReasonFault("a".repeat(501))).toBe(
      REDUCTION_REASON_TOO_LONG,
    );
  });

  it("counts an emoji as one letter, as the database does", () => {
    expect(reductionReasonFault("😀😀😀😀")).toBe(REDUCTION_REASON_TOO_SHORT);
    expect(reductionReasonFault("😀😀😀😀😀")).toBeNull();
  });
});

describe("reductionStanding", () => {
  it("lets a violation that went up be reduced", () => {
    expect(reductionStanding(GONE_UP, hoursLater(3))).toBe("reducible");
    expect(
      reductionStanding({ ...GONE_UP, appeal: "rejected" }, hoursLater(1)),
    ).toBe("reducible");
  });

  it("refuses one waiting for its announcement or in Masa advokasi", () => {
    expect(reductionStanding(GONE_UP, hoursLater(-1))).toBe("not_escalated");
    expect(reductionStanding(GONE_UP, hoursLater(2))).toBe("not_escalated");
  });

  it("refuses one whose appeal waits or was accepted", () => {
    for (const appeal of ["waiting", "accepted"] as const) {
      expect(reductionStanding({ ...GONE_UP, appeal }, hoursLater(30))).toBe(
        "not_escalated",
      );
    }
  });

  it("refuses one cancelled, and one reduced already", () => {
    expect(
      reductionStanding(
        { ...GONE_UP, cancelledAt: hoursLater(-2) },
        hoursLater(4),
      ),
    ).toBe("not_escalated");
    expect(
      reductionStanding(
        { ...GONE_UP, reducedAt: hoursLater(4) },
        hoursLater(5),
      ),
    ).toBe("reduced");
  });
});
