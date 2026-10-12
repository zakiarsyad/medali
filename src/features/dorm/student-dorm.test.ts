import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readStudentDorm } from "./student-dorm";
import { addTestProgram, addTestStudent, DAY, ODD_2026 } from "./test-records";

const inTestDatabase = withTestDatabase();
const NOBODY = "00000000-0000-4000-8000-000000000000";

describe("readStudentDorm", () => {
  it("gives the dorm of a student in semester 1 of the running period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama");
      const id = await addTestStudent(db, program, {
        nim: "9911260001",
        name: "Mahasiswi Uji",
      });

      expect(await readStudentDorm(db, id, DAY)).toBe("dana_rakca");
    });
  });

  it("gives no dorm to a student in semester 3 of the running period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama");
      const id = await addTestStudent(db, program, {
        nim: "9911250001",
        name: "Mahasiswi Uji",
        cohortYear: 2025,
      });

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("gives no dorm to a Reguler student when no period runs", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama");
      const id = await addTestStudent(db, program, {
        nim: "9911260001",
        name: "Mahasiswi Uji",
      });

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("gives no dorm to a removed student", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama");
      const id = await addTestStudent(db, program, {
        nim: "9911260001",
        name: "Mahasiswi Uji",
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
