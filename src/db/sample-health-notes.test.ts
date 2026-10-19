import { describe, expect, it } from "vitest";
import { studentSemester } from "@/academic-periods/student-semester";
import { dormOf } from "@/dorms/resident-rule";
import { ADVICE_MAX, SHORT_TEXT_MAX } from "@/features/fitness/health-ids";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import { sampleCompanionDorm } from "./sample-dorms";
import { SAMPLE_FITNESS_TESTS } from "./sample-fitness-scores";
import { SAMPLE_HEALTH_NOTES } from "./sample-health-notes";

const ACTIVE = SAMPLE_STUDENTS.filter(
  (student) => (student.status ?? "active") === "active",
);
const BY_NIM = new Map(ACTIVE.map((student) => [student.nim, student]));

/** The latest sample fitness score of a student, or null for none. */
function latestScore(nim: string): number | null {
  let latest: number | null = null;
  for (const test of SAMPLE_FITNESS_TESTS) {
    for (const [scored, score] of test.scores) {
      if (scored === nim) latest = score;
    }
  }
  return latest;
}

/** Whether a student lives in no dorm on a day, by the dorm rule. */
function livesInNoDorm(nim: string, day: string): boolean {
  const student = BY_NIM.get(nim);
  const [running] = samplePeriods(day);
  if (!student || !running) return false;
  const semester = studentSemester(student.cohortYear, running);
  const facts = {
    status: "active",
    entryPath: student.entryPath,
    sex: student.sex,
    isInternational: student.isInternational ?? false,
    isSeedling: student.isSeedling ?? false,
  } as const;
  return dormOf(facts, semester, sampleCompanionDorm(nim), null) === null;
}

describe("the sample health notes", () => {
  it.each(SAMPLE_HEALTH_NOTES)(
    "name an Aktif sample student who lives in no dorm, now and in the years to come: $nim",
    (note) => {
      expect(BY_NIM.has(note.nim)).toBe(true);
      for (const day of ["2026-02-16", "2026-10-16", "2029-10-16"]) {
        expect(livesInNoDorm(note.nim, day)).toBe(true);
      }
    },
  );

  it.each(SAMPLE_HEALTH_NOTES)(
    "hold an illness or a text, each within its length: $nim",
    (note) => {
      const texts = [note.otherHistory, note.medicine, note.advice];
      expect(
        note.illnesses.length > 0 || texts.some((text) => text !== ""),
      ).toBe(true);
      const short = [
        note.examiner ?? "",
        note.otherHistory,
        note.medicine,
        ...note.illnesses.map((each) => each.note),
      ];
      for (const text of short) {
        expect(text.length).toBeLessThanOrEqual(SHORT_TEXT_MAX);
      }
      expect(note.advice.length).toBeLessThanOrEqual(ADVICE_MAX);
    },
  );

  it("are oldest first, with one student's note saved again", () => {
    const days = SAMPLE_HEALTH_NOTES.map((note) => note.daysAgo);
    expect(days).toEqual([...days].sort((a, b) => b - a));
    const nims = SAMPLE_HEALTH_NOTES.map((note) => note.nim);
    expect(new Set(nims).size).toBeLessThan(nims.length);
  });

  it("give the spec's three examples with the sample fitness scores", () => {
    const pairs = SAMPLE_HEALTH_NOTES.map((note) => ({
      score: latestScore(note.nim),
      category: note.category,
    }));
    expect(pairs).toContainEqual({ score: 88, category: "attention" });
    expect(pairs).toContainEqual({
      score: expect.toSatisfy((score) => score !== null && score < 55),
      category: "good",
    });
    expect(pairs).toContainEqual({ score: null, category: "attention" });
  });
});
