import { describe, expect, it } from "vitest";
import {
  fewestFilled,
  type MentoringProgress,
  progressComplete,
  progressLine,
} from "./mentee-progress";

const PROGRESS: MentoringProgress = {
  period: { startYear: 2026, term: "odd" },
  filled: 2,
  meetings: 4,
  scored: 10,
  students: 12,
};

describe("fewestFilled", () => {
  it("takes the group with the fewest meetings filled in, as the prototype does", () => {
    const counts = new Map([
      ["a", 3],
      ["b", 1],
    ]);

    expect(fewestFilled(["a", "b"], counts)).toBe(1);
  });

  it("counts a group with no meeting filled in as none", () => {
    expect(fewestFilled(["a", "b"], new Map([["a", 4]]))).toBe(0);
  });
});

describe("progressComplete", () => {
  it("is complete only once every meeting is filled in and every anak asuh is scored", () => {
    expect(progressComplete(PROGRESS)).toBe(false);
    expect(progressComplete({ ...PROGRESS, filled: 4 })).toBe(false);
    expect(progressComplete({ ...PROGRESS, scored: 12 })).toBe(false);
    expect(progressComplete({ ...PROGRESS, filled: 4, scored: 12 })).toBe(true);
  });
});

describe("progressLine", () => {
  it("names the semester, the meetings filled in and the anak asuh scored", () => {
    expect(progressLine(PROGRESS)).toBe(
      "Semester Ganjil 2026/2027: 2 dari 4 pertemuan pengasuhan sudah diisi daftar hadirnya, dan 10 dari 12 anak asuh sudah Anda nilai.",
    );
  });
});
