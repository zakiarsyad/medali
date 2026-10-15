import { describe, expect, it } from "vitest";
import {
  appealStanding,
  REASON_TOO_LONG,
  REASON_TOO_SHORT,
  reasonFault,
} from "./appeal-rules";

// 21:00 on campus on 12 October 2026.
const ANNOUNCED = new Date("2026-10-12T14:00:00Z");
const MINUTE_MS = 60 * 1000;

function minutesLater(minutes: number): Date {
  return new Date(ANNOUNCED.getTime() + minutes * MINUTE_MS);
}

describe("appealStanding", () => {
  it("is open from the announcement hour until 3 hours later", () => {
    expect(appealStanding(ANNOUNCED, false, ANNOUNCED)).toBe("open");
    expect(appealStanding(ANNOUNCED, false, minutesLater(179))).toBe("open");
  });

  it("is not open before the announcement hour", () => {
    expect(appealStanding(ANNOUNCED, false, minutesLater(-1))).toBe(
      "not_announced",
    );
  });

  it("is over from 3 hours after the announcement", () => {
    expect(appealStanding(ANNOUNCED, false, minutesLater(180))).toBe("over");
  });

  it("is closed once the violation has an appeal, whenever it is asked", () => {
    expect(appealStanding(ANNOUNCED, true, minutesLater(10))).toBe("appealed");
    expect(appealStanding(ANNOUNCED, true, minutesLater(600))).toBe("appealed");
  });
});

describe("reasonFault", () => {
  it("takes 15 to 500 letters, not counting spaces around them", () => {
    expect(reasonFault(`  ${"a".repeat(15)}  `)).toBeNull();
    expect(reasonFault("a".repeat(500))).toBeNull();
  });

  it("refuses fewer than 15 letters", () => {
    expect(reasonFault(`   ${"a".repeat(14)}   `)).toBe(REASON_TOO_SHORT);
    expect(REASON_TOO_SHORT).toBe("Alasan advokasi minimal 15 karakter.");
  });

  it("refuses more than 500 letters, counting an emoji as one", () => {
    expect(reasonFault("a".repeat(501))).toBe(REASON_TOO_LONG);
    expect(reasonFault("😀".repeat(500))).toBeNull();
  });
});
