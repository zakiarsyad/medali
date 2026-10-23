// Sample Tahun akademik of this file: 5410 to 5410.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPeriods,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { addTestActor, addTestUpload } from "@/features/skpm/test-skpm";
import { readOwnGrade } from "./own-grade";

// Sample NIMs of this file: 9989730000 to 9989730099.

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 5410/5411, which runs then. */
const TODAY = "5410-10-20";

/** A day before every period, when no semester runs. */
const BEFORE_ALL = "0100-01-01";

/** Ani and Budi, Aktif, each with their own SKPM points. */
async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 5410);
  const programId = await addTestProgram(db, "UJINILAISENDIRI");
  const student = (nim: string, name: string) =>
    addTestStudentAccount(db, programId, { nim, name, cohortYear: 5409 });
  const ani = await student("9989730001", "Ani Uji Nilai Sendiri");
  const budi = await student("9989730002", "Budi Uji Nilai Sendiri");
  const kepala = await addTestActor(db, "Kepala Uji Nilai Sendiri", [
    "head_of_unit",
  ]);
  await addTestUpload(db, kepala, {
    mode: "add",
    periodId: periods.oddId,
    enteredAt: new Date("5410-10-10T03:00:00Z"),
    rows: [
      { studentId: ani.studentId, points: 20 },
      { studentId: ani.studentId, points: 16 },
      { studentId: budi.studentId, points: 50 },
    ],
  });
  return { ani, budi };
}

describe("readOwnGrade", () => {
  it("gives the student's own grade with its parts and their SKPM points", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const own = await readOwnGrade(db, ani, TODAY);

      expect(own).toMatchObject({
        grade: { row: { student: { id: ani.studentId }, skpm: 72 } },
        skpmPoints: 36,
      });
    });
  });

  it("only ever gives a student their own grade, whichever other role they hold", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi } = await addRecords(db);
      const alsoHead = {
        ...ani,
        roles: ["student", "head_of_unit"] as RoleId[],
      };

      const forBudi = await readOwnGrade(db, budi, TODAY);
      const forHead = await readOwnGrade(db, alsoHead, TODAY);

      expect(forBudi).toMatchObject({
        grade: { row: { student: { id: budi.studentId } } },
        skpmPoints: 50,
      });
      expect(forHead).toMatchObject({
        grade: { row: { student: { id: ani.studentId } } },
        skpmPoints: 36,
      });
    });
  });

  it("has no grade while no semester runs", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      expect(await readOwnGrade(db, ani, BEFORE_ALL)).toEqual({ grade: null });
    });
  });

  it("has no grade for a student who is Cuti or Non aktif", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      for (const status of ["on_leave", "inactive"] as const) {
        await db
          .update(students)
          .set({ status })
          .where(eq(students.id, ani.studentId));

        expect(await readOwnGrade(db, ani, TODAY)).toEqual({ grade: null });
      }
    });
  });

  it("refuses an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const penilaiOfAni = { ...ani, roles: ["assessor"] as RoleId[] };

      expect(await readOwnGrade(db, penilaiOfAni, TODAY)).toBeNull();
    });
  });
});
