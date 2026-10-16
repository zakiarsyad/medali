import { describe, expect, it } from "vitest";
import {
  SCORE_MAX,
  SCORE_MIN,
  STARTING_LIMITS,
} from "@/features/fitness/fitness-ids";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_FITNESS_TESTS, sampleTestDay } from "./sample-fitness-scores";

const ACTIVE = SAMPLE_STUDENTS.filter(
  (student) => (student.status ?? "active") === "active",
);
const BY_NIM = new Map(ACTIVE.map((student) => [student.nim, student]));

const ALL_SCORES = SAMPLE_FITNESS_TESTS.flatMap((test) =>
  test.scores.map(([, score]) => score),
);

/** What makes the sample group of a student: angkatan, program and jalur. */
function groupOf(nim: string): string {
  const student = BY_NIM.get(nim);
  if (!student) return `missing ${nim}`;
  return `${student.cohortYear} ${student.studyProgram} ${student.entryPath}`;
}

describe("the sample fitness tests", () => {
  it.each(SAMPLE_FITNESS_TESTS)(
    "name Aktif sample students of one sample group, with whole scores 0–100: $scores",
    (test) => {
      const groups = new Set(test.scores.map(([nim]) => groupOf(nim)));
      expect(groups.size).toBe(1);
      for (const [nim, score] of test.scores) {
        expect(BY_NIM.has(nim)).toBe(true);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(SCORE_MIN);
        expect(score).toBeLessThanOrEqual(SCORE_MAX);
      }
    },
  );

  it("give a score of every category of the starting limits", () => {
    const { excellentFrom, goodFrom, attentionFrom } = STARTING_LIMITS;
    expect(ALL_SCORES.some((score) => score >= excellentFrom)).toBe(true);
    expect(
      ALL_SCORES.some((score) => score >= goodFrom && score < excellentFrom),
    ).toBe(true);
    expect(
      ALL_SCORES.some((score) => score >= attentionFrom && score < goodFrom),
    ).toBe(true);
    expect(ALL_SCORES.some((score) => score < attentionFrom)).toBe(true);
  });

  it("are oldest first, some last year and some this year, with a student tested in both", () => {
    const today = "2026-10-16";
    const days = SAMPLE_FITNESS_TESTS.map((test) =>
      sampleTestDay(today, test.when),
    );
    expect(days).toEqual([...days].sort());
    expect(days.some((day) => day.startsWith("2025-"))).toBe(true);
    expect(days.some((day) => day.startsWith("2026-"))).toBe(true);
    const nims = SAMPLE_FITNESS_TESTS.flatMap((test) =>
      test.scores.map(([nim]) => nim),
    );
    expect(new Set(nims).size).toBeLessThan(nims.length);
  });

  it("leave most Aktif students without a test", () => {
    const tested = new Set(
      SAMPLE_FITNESS_TESTS.flatMap((test) => test.scores.map(([nim]) => nim)),
    );
    expect(tested.size).toBeLessThan(ACTIVE.length / 2);
  });

  it("include students of the sample Ketua Program Studi's program and of others", () => {
    const head = SAMPLE_ACCOUNTS.find((account) =>
      account.roles.includes("head_of_program"),
    );
    const programs = SAMPLE_FITNESS_TESTS.flatMap((test) =>
      test.scores.map(([nim]) => BY_NIM.get(nim)?.studyProgram),
    );
    expect(programs).toContain(head?.studyProgram);
    expect(programs.some((program) => program !== head?.studyProgram)).toBe(
      true,
    );
  });
});

describe("sampleTestDay", () => {
  it("puts a test of last year late in that year", () => {
    expect(sampleTestDay("2026-10-16", "last_year")).toBe("2025-11-20");
  });

  it("puts a test some days ago on that day", () => {
    expect(sampleTestDay("2026-10-16", { daysAgo: 10 })).toBe("2026-10-06");
  });

  it("never puts a test of this year before New Year's Day", () => {
    expect(sampleTestDay("2026-01-05", { daysAgo: 40 })).toBe("2026-01-01");
  });
});
