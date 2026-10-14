// Sample Tahun akademik of this file: 2570 to 2570.
import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readStudentDorm } from "./student-dorm";

const inTestDatabase = withTestDatabase();
const NOBODY = "00000000-0000-4000-8000-000000000000";

/** The period the checks run in: angkatan 2570 is in semester 1. */
const ODD_2570 = {
  startYear: 2570,
  term: "odd",
  startsOn: "2570-08-01",
  endsOn: "2571-01-31",
} as const;
const DAY = "2570-10-12";

describe("readStudentDorm", () => {
  it("gives the dorm of a student in semester 1 of the running period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2570);
      const program = await addTestProgram(db, "Prodi Uji Asrama A");
      const id = await addTestStudent(db, program, {
        nim: "9921260001",
        name: "Mahasiswi Uji",
        cohortYear: 2570,
      });

      expect(await readStudentDorm(db, id, DAY)).toBe("dana_rakca");
    });
  });

  it("gives no dorm to a student in semester 3 of the running period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2570);
      const program = await addTestProgram(db, "Prodi Uji Asrama A");
      const id = await addTestStudent(db, program, {
        nim: "9921250001",
        name: "Mahasiswi Uji",
        cohortYear: 2569,
      });

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("gives no dorm to a Reguler student when no period runs", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama A");
      const id = await addTestStudent(db, program, {
        nim: "9921260001",
        name: "Mahasiswi Uji",
      });

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("gives no dorm to a removed student", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2570);
      const program = await addTestProgram(db, "Prodi Uji Asrama A");
      const id = await addTestStudent(db, program, {
        nim: "9921260001",
        name: "Mahasiswi Uji",
        cohortYear: 2570,
        deletedAt: new Date(),
      });

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("gives no dorm to a student that does not exist", async () => {
    await inTestDatabase(async (db) => {
      expect(await readStudentDorm(db, NOBODY, DAY)).toBeNull();
    });
  });
});
