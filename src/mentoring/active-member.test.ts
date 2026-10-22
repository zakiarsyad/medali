// Sample NIMs of this file: 9989430000 to 9989430099.
import { and, inArray, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { activeAmong } from "./active-member";

const inTestDatabase = withTestDatabase();

async function idsWhere(db: Database, where: SQL, among: string[]) {
  const found = await db
    .select({ id: students.id })
    .from(students)
    .where(and(inArray(students.id, among), where));
  return found.map((row) => row.id);
}

describe("activeAmong", () => {
  it("lets through only the Aktif students of those visible, as the lists of Penilaian hold them", async () => {
    await inTestDatabase(async (db) => {
      const own = await addTestProgram(db, "Prodi Uji Aktif Sendiri");
      const other = await addTestProgram(db, "Prodi Uji Aktif Lain");
      const ani = await addTestStudent(db, own, {
        nim: "9989430001",
        name: "Mahasiswa Uji Aktif",
      });
      const budi = await addTestStudent(db, own, {
        nim: "9989430002",
        name: "Mahasiswa Uji Cuti",
        status: "on_leave",
      });
      const citra = await addTestStudent(db, other, {
        nim: "9989430003",
        name: "Mahasiswa Uji Prodi Lain",
      });
      const among = [ani, budi, citra];
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [own],
        menteesOf: [],
        studentIds: [],
      });

      expect(await idsWhere(db, activeAmong(ownProgram), among)).toEqual([ani]);
      expect(
        (await idsWhere(db, activeAmong(visibleTo({ kind: "all" })), among))
          .length,
      ).toBe(2);
    });
  });
});
