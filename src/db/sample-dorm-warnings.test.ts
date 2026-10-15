import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { violationStatus } from "@/features/dorm/violation-status";
import { SP1_VIOLATIONS, SP2_VIOLATIONS } from "@/features/dorm/warning-ids";
import { SAMPLE_VIOLATION_RESIDENTS } from "./sample-dorm-violations";
import {
  SAMPLE_WARNING_RESIDENTS,
  sampleDormWarnings,
} from "./sample-dorm-warnings";

// 10:00 on campus on 14 October 2026.
const NOW = new Date("2026-10-14T03:00:00Z");
const PERIOD_START = "2026-08-01";

describe("sampleDormWarnings", () => {
  const { violations, letters } = sampleDormWarnings(NOW, PERIOD_START);
  const { called, firstLetter, secondLetter } = SAMPLE_WARNING_RESIDENTS;
  const countOf = (resident: number) =>
    violations.filter((violation) => violation.resident === resident).length;

  it("gives one resident 7 counted violations, one 8 and one 12, none of the other sample violations' residents", () => {
    expect(countOf(called)).toBe(SP1_VIOLATIONS);
    expect(countOf(firstLetter)).toBe(SP1_VIOLATIONS + 1);
    expect(countOf(secondLetter)).toBe(SP2_VIOLATIONS);
    for (const violation of violations) {
      expect(violation.resident).toBeGreaterThanOrEqual(
        SAMPLE_VIOLATION_RESIDENTS,
      );
      expect(violationStatus(violation.announcedAt, null, NOW)).toBe(
        "escalated",
      );
      expect(violation.day >= PERIOD_START).toBe(true);
    }
  });

  it("calls one resident for tomorrow, gives one SP 1 and one SP 1 and SP 2 with the proposal", () => {
    const shown = letters.map((letter) => [
      letter.resident,
      letter.level,
      letter.issue !== null,
      letter.issue?.proposalNote !== "" && letter.issue !== null,
    ]);

    expect(shown).toEqual([
      [called, 1, false, false],
      [firstLetter, 1, true, false],
      [secondLetter, 1, true, false],
      [secondLetter, 2, true, true],
    ]);
    const [call] = letters;
    expect(call && call.call.day > campusDay(NOW)).toBe(true);
  });

  it("issues every SP after its call was sent, and before now", () => {
    for (const { call, issue } of letters) {
      expect(call.sentAt.getTime()).toBeLessThan(NOW.getTime());
      if (issue === null) continue;
      expect(issue.at.getTime()).toBeGreaterThan(call.sentAt.getTime());
      expect(issue.at.getTime()).toBeLessThan(NOW.getTime());
    }
  });

  it("never puts a violation before the running period, even early in it", () => {
    const early = sampleDormWarnings(
      new Date("2026-08-05T03:00:00Z"),
      PERIOD_START,
    );
    for (const violation of early.violations) {
      expect(violation.day >= PERIOD_START).toBe(true);
    }
  });
});
