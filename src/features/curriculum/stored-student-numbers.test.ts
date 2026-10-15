// Sample Tahun akademik of this file: 3300 to 3300.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readCohortCounts } from "./stored-student-numbers";

const inTestDatabase = withTestDatabase();

/** The angkatan only this file adds students to. */
const COHORT = 3300;

async function countOfCohort(db: Database): Promise<number | undefined> {
  const counts = await readCohortCounts(db);
  return counts.find((cohort) => cohort.cohortYear === COHORT)?.students;
}

describe("readCohortCounts", () => {
  it("counts the Aktif students of every program, not those on Cuti, Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const one = await addTestProgram(db, "Prodi Uji Kurikulum A");
      const other = await addTestProgram(db, "Prodi Uji Kurikulum B");
      const add = (programId: number, nim: string, more = {}) =>
        addTestStudent(db, programId, {
          nim,
          name: `Mahasiswa Uji ${nim}`,
          cohortYear: COHORT,
          ...more,
        });
      await add(one, "9988700001");
      await add(other, "9988700002");
      await add(one, "9988700003", { status: "on_leave" });
      await add(one, "9988700004", { status: "inactive" });
      const removed = await add(one, "9988700005");
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, removed));

      expect(await countOfCohort(db)).toBe(2);
    });
  });

  it("gives no row for an angkatan without an Aktif student", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Kurikulum A");
      await addTestStudent(db, program, {
        nim: "9988700006",
        name: "Mahasiswa Uji Cuti",
        cohortYear: COHORT,
        status: "on_leave",
      });

      expect(await countOfCohort(db)).toBeUndefined();
    });
  });
});
