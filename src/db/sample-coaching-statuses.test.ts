import { describe, expect, it } from "vitest";
import { coachingNeedOf } from "@/character-scores/coaching-need";
import {
  COACHING_NOTE_MAX_LENGTH,
  FIRST_COACHING_STATUS,
} from "@/character-scores/coaching-status";
import { SAMPLE_ASSESSMENTS } from "./sample-character-assessments";
import { SAMPLE_COACHING_STATUSES } from "./sample-coaching-statuses";
import { SAMPLE_STUDENTS } from "./sample-data";

const ACTIVE_NIMS = new Set(
  SAMPLE_STUDENTS.filter(
    (student) => (student.status ?? "active") === "active",
  ).map((student) => student.nim),
);

/** The latest sample assessment of a student: the last one in the list. */
function latestOf(nim: string) {
  return SAMPLE_ASSESSMENTS.filter((each) => each.nim === nim).at(-1);
}

describe("the sample coaching statuses", () => {
  it.each(SAMPLE_COACHING_STATUSES)(
    "name an Aktif sample student their latest assessment lists, moved after it to a later status with a short note: $nim",
    (sample) => {
      expect(ACTIVE_NIMS.has(sample.nim)).toBe(true);
      const latest = latestOf(sample.nim);
      if (!latest) throw new Error("The student has no sample assessment.");
      const [M, E, D, A, L, I] = latest.scores;
      expect(coachingNeedOf({ M, E, D, A, L, I })).not.toBeNull();
      expect(sample.daysAgo).toBeLessThan(latest.daysAgo);
      expect(sample.status).not.toBe(FIRST_COACHING_STATUS);
      expect(sample.note.length).toBeLessThanOrEqual(COACHING_NOTE_MAX_LENGTH);
    },
  );

  it("name each student once, and leave some listed students without one", () => {
    const nims = SAMPLE_COACHING_STATUSES.map((sample) => sample.nim);
    expect(new Set(nims).size).toBe(nims.length);
    const listed = [...new Set(SAMPLE_ASSESSMENTS.map((each) => each.nim))]
      .filter((nim) => ACTIVE_NIMS.has(nim))
      .filter((nim) => {
        const [M = 0, E = 0, D = 0, A = 0, L = 0, I = 0] =
          latestOf(nim)?.scores ?? [];
        return coachingNeedOf({ M, E, D, A, L, I }) !== null;
      });
    expect(listed.some((nim) => !nims.includes(nim))).toBe(true);
  });
});
