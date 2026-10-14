import { describe, expect, it } from "vitest";
import { DORM_IDS } from "@/dorms/dorms";
import { sampleDormActivities } from "./sample-dorm-activities";
import {
  type KeptSampleActivity,
  type SampleResident,
  sampleDormCounts,
} from "./sample-dorm-counts";

const DAY = "2026-10-14";
const activities: KeptSampleActivity[] = sampleDormActivities(DAY).map(
  (sample, place) => ({ id: `kegiatan-${place}`, sample }),
);
/** Twelve residents in each dorm. */
const residents: SampleResident[] = DORM_IDS.flatMap((dorm) =>
  Array.from({ length: 12 }, (_, place) => ({ id: `${dorm}-${place}`, dorm })),
);
const counts = sampleDormCounts(DAY, activities, residents);

function absentIn(marks: Record<string, { isAbsent: boolean }>): number {
  return Object.values(marks).filter((mark) => mark.isAbsent).length;
}

describe("sampleDormCounts", () => {
  it("counts the seven days before the day, and not the day itself", () => {
    const days = [...new Set(counts.map((count) => count.day))].sort();

    expect(days).toEqual([
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
    ]);
  });

  it("has one count at most for an activity on a day", () => {
    const keys = counts.map((count) => `${count.activityId} ${count.day}`);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names every resident the activity is for, and no other", () => {
    for (const count of counts) {
      const named = Object.keys(count.marks);

      expect(named.length).toBeGreaterThan(0);
      expect(new Set(named).size).toBe(named.length);
    }
    const women = counts.find((count) =>
      Object.keys(count.marks).every(
        (id) =>
          id.startsWith("wismantara_putri") || id.startsWith("dana_rakca"),
      ),
    );
    expect(women).toBeDefined();
  });

  it("has announced counts with some absent, one draft and one corrected", () => {
    const stages = counts.map((count) => count.stage);

    expect(stages.filter((stage) => stage === "draft")).toHaveLength(1);
    expect(stages.filter((stage) => stage === "corrected")).toHaveLength(1);
    expect(stages).toContain("announced");
    expect(counts.some((count) => absentIn(count.marks) > 0)).toBe(true);
  });

  it("leaves the last activity of the day before uncounted, and makes the one before it a draft", () => {
    const yesterday = counts.filter((count) => count.day === "2026-10-13");

    expect(yesterday.at(-1)?.stage).toBe("draft");
    expect(yesterday.length).toBeGreaterThan(0);
  });

  it("gives a corrected count one more absent in its first announcement than now", () => {
    const corrected = counts.find((count) => count.stage === "corrected");
    if (!corrected?.firstMarks) throw new Error("No corrected count.");

    expect(absentIn(corrected.firstMarks)).toBe(absentIn(corrected.marks) + 1);
  });
});
