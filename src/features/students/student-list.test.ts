import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import { withTestDatabase } from "@/db/test-database";
import { listStudents } from "./student-list";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const EVERYONE: RowLimit = { kind: "all" };

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

describe("listStudents", () => {
  it("gives what the table shows, by name", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Tabel");
      await addTestStudent(db, program, {
        nim: "9900000312",
        name: "Tabel Uji Budi",
        status: "on_leave",
      });
      await addTestStudent(db, program, {
        nim: "9900000311",
        name: "Tabel Uji Ani",
        entryPath: "transfer",
        originAgency: "Direktorat Jenderal Pajak",
        cohortYear: 2024,
        className: "2-01",
        province: "Bali",
        isSeedling: true,
      });

      const listed = await listStudents(db, onlyProgram(program));

      expect(listed.students).toEqual([
        {
          nim: "9900000311",
          name: "Tabel Uji Ani",
          status: "active",
          isAffirmation: false,
          isSeedling: true,
          isInternational: false,
          studyProgram: "Prodi Uji Tabel",
          entryPath: "transfer",
          originAgency: "Direktorat Jenderal Pajak",
          cohortYear: 2024,
          className: "2-01",
          province: "Bali",
        },
        expect.objectContaining({ nim: "9900000312", status: "on_leave" }),
      ]);
    });
  });

  it("gives only the rows the account may see, never a removed one", async () => {
    await inTestDatabase(async (db) => {
      const own = await addTestProgram(db, "Prodi Uji Batas Sendiri");
      const other = await addTestProgram(db, "Prodi Uji Batas Lain");
      await addTestStudent(db, own, { nim: "9900000313", name: "Batas Satu" });
      await addTestStudent(db, other, { nim: "9900000314", name: "Batas Dua" });
      await addTestStudent(db, own, {
        nim: "9900000315",
        name: "Batas Dihapus",
        deletedAt: new Date("2026-10-11T03:00:00Z"),
      });

      const forAll = await listStudents(db, EVERYONE);
      const forOwn = await listStudents(db, onlyProgram(own));

      const batas = forAll.students.filter((s) => s.name.startsWith("Batas"));
      expect(batas.map((s) => s.nim)).toEqual(["9900000314", "9900000313"]);
      expect(forOwn.students.map((s) => s.nim)).toEqual(["9900000313"]);
    });
  });
});
