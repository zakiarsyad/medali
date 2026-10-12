import { describe, expect, it } from "vitest";
import { pagesFor } from "@/auth/access";
import { DORM_IDS, type DormId } from "@/features/dorm/dorms";
import { dormOf } from "@/features/dorm/resident-rule";
import { ORIGIN_AGENCIES, PROVINCES } from "@/features/students/fixed-lists";
import { isNim } from "@/features/students/input-limits";
import { CATEGORIES } from "@/features/students/labels";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
  samplePeriods,
} from "./sample-data";
import { SAMPLE_ROOMS, sampleFirstYears, samplePlaces } from "./sample-dorms";
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

describe("the sample students of a first year", () => {
  const firstYears = sampleFirstYears(2026);
  const placed = SAMPLE_ROOMS.reduce((sum, room) => sum + room.placed, 0);

  function residentsOf(dorm: DormId) {
    return firstYears.filter((student) => {
      const facts = {
        status: "active" as const,
        entryPath: student.entryPath,
        sex: student.sex,
        isInternational: student.isInternational ?? false,
        isSeedling: student.isSeedling ?? false,
      };
      return dormOf(facts, 1) === dorm;
    });
  }

  it("each have their own 10-digit NIM and name, used by no other sample", () => {
    const everyone = [...SAMPLE_STUDENTS, ...firstYears];
    for (const student of firstYears) {
      expect(isNim(student.nim)).toBe(true);
    }
    expect(new Set(everyone.map((s) => s.nim)).size).toBe(everyone.length);
    expect(new Set(everyone.map((s) => s.name)).size).toBe(everyone.length);
  });

  it("are all of the angkatan asked for, on the Reguler jalur", () => {
    for (const student of firstYears) {
      expect(student.cohortYear).toBe(2026);
      expect(student.entryPath).toBe("regular");
      expect(PROVINCES).toContain(student.province);
    }
  });

  it.each(DORM_IDS)("leave residents of %s without a room", (dorm) => {
    expect(residentsOf(dorm).length).toBeGreaterThan(placed);
  });

  it("leave more than 60 residents of one dorm without a room", () => {
    expect(residentsOf("dana_rakca").length - placed).toBeGreaterThan(60);
  });
});

describe("samplePlaces", () => {
  it("puts the first residents in NIM order into the rooms", () => {
    const [first, second] = SAMPLE_ROOMS;
    const nims = ["9900261009", "9900261003", "9900261001", "9900261002"];

    const places = samplePlaces(nims);

    expect(first?.placed).toBe(2);
    expect(places.slice(0, 3)).toEqual([
      { roomNumber: first?.number, nim: "9900261001" },
      { roomNumber: first?.number, nim: "9900261002" },
      { roomNumber: second?.number, nim: "9900261003" },
    ]);
  });

  it("never puts more residents in a room than it holds", () => {
    for (const room of SAMPLE_ROOMS) {
      expect(room.placed).toBeLessThanOrEqual(room.capacity);
    }
  });

  it("places nobody when a dorm has no residents", () => {
    expect(samplePlaces([])).toEqual([]);
  });
});
