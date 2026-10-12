import { describe, expect, it } from "vitest";
import { jurusanOf } from "@/features/cohort-assignments/jurusan";
import {
  DEFAULT_TARGET_SIZE,
  groupCount,
} from "@/features/cohort-assignments/target-size";
import { isUsualSize } from "@/ui/group-size";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";
import { sampleFirstYears } from "./sample-dorms";
import {
  SAMPLE_MENTOR_OF_NEWEST_ONLY,
  SAMPLE_MENTORS_WITHOUT_GROUP,
} from "./sample-mentor-groups";
import {
  SAMPLE_NEW_INTAKE_PROGRAMS,
  sampleGroupedFirstYears,
  sampleNewIntake,
} from "./sample-new-intake";

const YEAR = 2026;
const newIntake = sampleNewIntake(YEAR);

/** How many groups "Bentuk kelompok" makes of a program at the starting size. */
function groupSizes(program: string) {
  const students = newIntake.filter((s) => s.studyProgram === program).length;
  return { groups: groupCount(students, DEFAULT_TARGET_SIZE), students };
}

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

  it("forms two usual groups in one program studi, to move a member between, and a small one in the other", () => {
    expect(groupSizes("D3 Pajak")).toEqual({ groups: 2, students: 51 });
    expect(groupSizes("D3 Akuntansi")).toEqual({ groups: 1, students: 17 });
    expect(isUsualSize(51 / 2)).toBe(true);
    expect(isUsualSize(17)).toBe(false);
  });

  it("has students of more than one kelas akademik in the program studi with two groups", () => {
    const classes = newIntake
      .filter((student) => student.studyProgram === "D3 Pajak")
      .map((student) => student.className);
    expect(new Set(classes).size).toBeGreaterThan(1);
  });

  it("has a mentor to choose for every group that is formed", () => {
    const groups =
      groupSizes("D3 Pajak").groups + groupSizes("D3 Akuntansi").groups;
    const toChoose = [
      ...SAMPLE_MENTORS_WITHOUT_GROUP,
      SAMPLE_MENTOR_OF_NEWEST_ONLY.name,
    ];
    expect(new Set(toChoose).size).toBe(groups);
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
      expect(spareUnits).toContain(jurusanOf(program));
    }
  });
});
