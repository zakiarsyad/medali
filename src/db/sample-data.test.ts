import { describe, expect, it } from "vitest";
import { pagesFor } from "@/auth/access";
import { ORIGIN_AGENCIES, PROVINCES } from "@/features/students/fixed-lists";
import { isNim } from "@/features/students/input-limits";
import { CATEGORIES } from "@/features/students/labels";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
  samplePeriods,
} from "./sample-data";
import { studentStatus } from "./schema";

describe("the sample account with two roles", () => {
  it("shows more pages than either of its roles alone", () => {
    const twoRoles = SAMPLE_ACCOUNTS.filter((a) => a.roles.length === 2);
    expect(twoRoles).toHaveLength(1);
    const roles = twoRoles[0]?.roles ?? [];
    const together = pagesFor(roles).length;
    for (const role of roles) {
      expect(together).toBeGreaterThan(pagesFor([role]).length);
    }
  });
});

describe("the sample PPKS activities", () => {
  it("spread over more than one semester, from 1 to 8", () => {
    const semesters = SAMPLE_PPKS_ACTIVITIES.map((a) => a.semester);
    expect(new Set(semesters).size).toBeGreaterThan(1);
    for (const semester of semesters) {
      expect(semester).toBeGreaterThanOrEqual(1);
      expect(semester).toBeLessThanOrEqual(8);
    }
  });

  it("aim only at indicators of their own values", () => {
    for (const activity of SAMPLE_PPKS_ACTIVITIES) {
      expect(activity.indicatorCodes.length).toBeGreaterThan(0);
      for (const code of activity.indicatorCodes) {
        expect(activity.valueKeys).toContain(code[0]);
        expect(code).toMatch(/^[MEDALI][1-4]$/);
      }
    }
  });
});

describe("the sample periods", () => {
  it("are the period of the day and the three before it, newest first", () => {
    expect(samplePeriods("2026-10-12")).toEqual([
      {
        startYear: 2026,
        term: "odd",
        startsOn: "2026-08-01",
        endsOn: "2027-01-31",
      },
      {
        startYear: 2025,
        term: "even",
        startsOn: "2026-02-01",
        endsOn: "2026-07-31",
      },
      {
        startYear: 2025,
        term: "odd",
        startsOn: "2025-08-01",
        endsOn: "2026-01-31",
      },
      {
        startYear: 2024,
        term: "even",
        startsOn: "2025-02-01",
        endsOn: "2025-07-31",
      },
    ]);
  });

  it.each([
    ["2027-01-31", 2026, "odd"],
    ["2027-02-01", 2026, "even"],
    ["2027-07-31", 2026, "even"],
    ["2027-08-01", 2027, "odd"],
  ])("put %s in the period of %i, %s", (day, startYear, term) => {
    const [running] = samplePeriods(day);
    expect(running).toMatchObject({ startYear, term });
    expect(running && running.startsOn <= day && day <= running.endsOn).toBe(
      true,
    );
  });
});

describe("the sample students", () => {
  function different<T>(values: T[]): number {
    return new Set(values).size;
  }

  it("are at least 60, each with their own 10-digit NIM and name", () => {
    expect(SAMPLE_STUDENTS.length).toBeGreaterThanOrEqual(60);
    for (const student of SAMPLE_STUDENTS) {
      expect(isNim(student.nim)).toBe(true);
    }
    const count = SAMPLE_STUDENTS.length;
    expect(different(SAMPLE_STUDENTS.map((s) => s.nim))).toBe(count);
    expect(different(SAMPLE_STUDENTS.map((s) => s.name))).toBe(count);
  });

  it("spread over several program studi, angkatan and both jalur", () => {
    expect(
      different(SAMPLE_STUDENTS.map((s) => s.studyProgram)),
    ).toBeGreaterThanOrEqual(5);
    expect(
      different(SAMPLE_STUDENTS.map((s) => s.cohortYear)),
    ).toBeGreaterThanOrEqual(3);
    expect(different(SAMPLE_STUDENTS.map((s) => s.entryPath))).toBe(2);
  });

  it("hold every kategori and all three statuses more than once", () => {
    for (const { field } of CATEGORIES) {
      const inCategory = SAMPLE_STUDENTS.filter((s) => s[field]);
      expect(inCategory.length).toBeGreaterThan(1);
    }
    for (const status of studentStatus.enumValues) {
      const withStatus = SAMPLE_STUDENTS.filter(
        (s) => (s.status ?? "active") === status,
      );
      expect(withStatus.length).toBeGreaterThan(1);
    }
  });

  it("name a listed provinsi, and an instansi asal only for Alih program", () => {
    for (const student of SAMPLE_STUDENTS) {
      expect(PROVINCES).toContain(student.province);
      if (student.entryPath === "transfer") {
        expect(ORIGIN_AGENCIES).toContain(student.originAgency);
      } else {
        expect(student.originAgency).toBeUndefined();
      }
    }
  });
});
