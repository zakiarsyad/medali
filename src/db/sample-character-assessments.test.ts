import { describe, expect, it } from "vitest";
import {
  NOTE_MAX_LENGTH,
  SCORE_MAX,
  SCORE_MIN,
} from "@/features/character-assessment/assessment-ids";
import {
  EARLIER,
  RECENT,
  SAMPLE_ASSESSMENTS,
} from "./sample-character-assessments";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";

const ACTIVE = SAMPLE_STUDENTS.filter(
  (student) => (student.status ?? "active") === "active",
);
const ACTIVE_NIMS = new Set(ACTIVE.map((student) => student.nim));

function timesAssessed(nim: string): number {
  return SAMPLE_ASSESSMENTS.filter((each) => each.nim === nim).length;
}

describe("the sample character assessments", () => {
  it.each(SAMPLE_ASSESSMENTS)(
    "name an Aktif sample student, with whole scores 40–100 and a short note: $nim, $daysAgo days ago",
    (assessment) => {
      expect(ACTIVE_NIMS.has(assessment.nim)).toBe(true);
      for (const score of assessment.scores) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(SCORE_MIN);
        expect(score).toBeLessThanOrEqual(SCORE_MAX);
      }
      expect(assessment.note.length).toBeLessThanOrEqual(NOTE_MAX_LENGTH);
    },
  );

  it("are oldest first, each made in an earlier period or in the last few days", () => {
    const days = SAMPLE_ASSESSMENTS.map((each) => each.daysAgo);
    expect(days).toEqual([...days].sort((one, other) => other - one));
    for (const day of days) {
      expect(day >= EARLIER || day < RECENT).toBe(true);
    }
  });

  it("give some students a history, some only an earlier one, some only a recent one, and most none", () => {
    const nims = [...new Set(SAMPLE_ASSESSMENTS.map((each) => each.nim))];
    const withHistory = nims.filter((nim) => timesAssessed(nim) > 1);
    const onlyEarlier = nims.filter((nim) =>
      SAMPLE_ASSESSMENTS.every(
        (each) => each.nim !== nim || each.daysAgo >= EARLIER,
      ),
    );
    const onlyRecent = nims.filter((nim) =>
      SAMPLE_ASSESSMENTS.every(
        (each) => each.nim !== nim || each.daysAgo < RECENT,
      ),
    );

    expect(withHistory.length).toBeGreaterThan(1);
    expect(onlyEarlier.length).toBeGreaterThan(0);
    expect(onlyRecent.length).toBeGreaterThan(0);
    expect(nims.length).toBeLessThan(ACTIVE.length / 2);
  });

  it("include students of the sample Ketua Program Studi's program and of others", () => {
    const head = SAMPLE_ACCOUNTS.find((account) =>
      account.roles.includes("head_of_program"),
    );
    const programOf = new Map(
      ACTIVE.map((student) => [student.nim, student.studyProgram]),
    );
    const programs = SAMPLE_ASSESSMENTS.map((each) => programOf.get(each.nim));

    expect(programs).toContain(head?.studyProgram);
    expect(programs.some((program) => program !== head?.studyProgram)).toBe(
      true,
    );
  });
});
