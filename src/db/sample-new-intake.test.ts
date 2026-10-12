import { describe, expect, it } from "vitest";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";
import { sampleFirstYears } from "./sample-dorms";
import { SAMPLE_MENTORS_WITHOUT_GROUP } from "./sample-mentor-groups";
import {
  SAMPLE_NEW_INTAKE_PROGRAMS,
  sampleGroupedFirstYears,
  sampleNewIntake,
} from "./sample-new-intake";

const YEAR = 2026;
const newIntake = sampleNewIntake(YEAR);

const JURUSAN_OF_PROGRAM: Record<string, string> = {
  "D3 Pajak": "Jurusan Pajak",
  "D3 Akuntansi": "Jurusan Akuntansi",
};

describe("the sample new angkatan", () => {
  it("is about 60 students of one angkatan in two program studi, all Reguler", () => {
    expect(newIntake.length).toBeGreaterThanOrEqual(50);
    expect(newIntake.length).toBeLessThanOrEqual(70);
    const programs = new Set(newIntake.map((student) => student.studyProgram));
    expect([...programs].sort()).toEqual(
      [...SAMPLE_NEW_INTAKE_PROGRAMS].sort(),
    );
    expect(programs.size).toBe(2);
    for (const student of newIntake) {
      expect(student.cohortYear).toBe(YEAR);
      expect(student.entryPath).toBe("regular");
    }
  });

  it("holds enough students of each program studi for one group of 25 to 35", () => {
    for (const program of SAMPLE_NEW_INTAKE_PROGRAMS) {
      const inProgram = newIntake.filter((s) => s.studyProgram === program);
      expect(inProgram.length).toBeGreaterThanOrEqual(25);
      expect(inProgram.length).toBeLessThanOrEqual(35);
    }
  });

  it("gives every student what the three methods read", () => {
    const sexes = new Set(newIntake.map((student) => student.sex));
    expect([...sexes].sort()).toEqual(["female", "male"]);
    for (const student of newIntake) {
      expect(student.nim).toMatch(/^\d{10}$/);
      expect(student.province).toBeTruthy();
      expect(student.className).toBeTruthy();
    }
  });

  it("is the students of the first year that the sample groups leave out", () => {
    const grouped = sampleGroupedFirstYears(YEAR);
    const nims = [...newIntake, ...grouped].map((student) => student.nim);
    expect(nims.sort()).toEqual(
      sampleFirstYears(YEAR)
        .map((student) => student.nim)
        .sort(),
    );
    expect(grouped.length).toBeGreaterThan(0);
    for (const student of grouped) {
      expect(SAMPLE_NEW_INTAKE_PROGRAMS).not.toContain(student.studyProgram);
    }
  });

  it("is of an angkatan no other sample student of its program studi belongs to", () => {
    const earlier = SAMPLE_STUDENTS.filter(
      (student) =>
        student.cohortYear === YEAR &&
        SAMPLE_NEW_INTAKE_PROGRAMS.includes(student.studyProgram),
    );
    expect(earlier).toEqual([]);
  });

  it("has a spare mentor of the jurusan of each of its program studi", () => {
    const spareUnits = SAMPLE_ACCOUNTS.filter((account) =>
      SAMPLE_MENTORS_WITHOUT_GROUP.includes(account.name),
    ).map((account) => account.unit);
    expect(spareUnits).toHaveLength(2);
    for (const program of SAMPLE_NEW_INTAKE_PROGRAMS) {
      expect(spareUnits).toContain(JURUSAN_OF_PROGRAM[program]);
    }
  });
});
