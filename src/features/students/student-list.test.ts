import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { listCohortYears, listStudents } from "./student-list";
import { NO_FILTERS, type StudentListFilters } from "./student-list-address";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const EVERYONE: RowLimit = { kind: "all" };

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

const ALL_STATUSES: StudentListFilters = { ...NO_FILTERS, status: "all" };

/** A program with students of each status, in two angkatan. */
async function addFilterRows(db: Database): Promise<RowLimit> {
  const program = await addTestProgram(db, "Prodi Uji Saring");
  const rows = [
    { nim: "9900000321", name: "Saring Aktif", cohortYear: 2024 },
    { nim: "9900000322", name: "Saring Cuti", status: "on_leave" as const },
    { nim: "9900000323", name: "Saring Nonaktif", status: "inactive" as const },
    { nim: "9900000324", name: "Lain Aktif", cohortYear: 2024 },
  ];
  for (const row of rows) await addTestStudent(db, program, row);
  return onlyProgram(program);
}

async function nimsFound(
  db: Database,
  limit: RowLimit,
  filters: Partial<StudentListFilters>,
): Promise<string[]> {
  const listed = await listStudents(db, limit, { ...NO_FILTERS, ...filters });
  return listed.students.map((student) => student.nim).sort();
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

      const listed = await listStudents(db, onlyProgram(program), ALL_STATUSES);

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

      const forAll = await listStudents(db, EVERYONE, NO_FILTERS);
      const forOwn = await listStudents(db, onlyProgram(own), NO_FILTERS);

      const batas = forAll.students.filter((s) => s.name.startsWith("Batas"));
      expect(batas.map((s) => s.nim)).toEqual(["9900000314", "9900000313"]);
      expect(forOwn.students.map((s) => s.nim)).toEqual(["9900000313"]);
    });
  });

  it("hides non-active students until the status asks for them", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addFilterRows(db);

      expect(await nimsFound(db, limit, {})).toEqual([
        "9900000321",
        "9900000322",
        "9900000324",
      ]);
      expect(await nimsFound(db, limit, { status: "all" })).toHaveLength(4);
      expect(await nimsFound(db, limit, { status: "inactive" })).toEqual([
        "9900000323",
      ]);
    });
  });

  it("narrows by a part of the name or of the NIM", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addFilterRows(db);

      expect(await nimsFound(db, limit, { query: "ring ak" })).toEqual([
        "9900000321",
      ]);
      expect(await nimsFound(db, limit, { query: "0000324" })).toEqual([
        "9900000324",
      ]);
      expect(await nimsFound(db, limit, { query: "Saring%" })).toEqual([]);
    });
  });

  it("narrows by angkatan, together with the other filters", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addFilterRows(db);

      expect(await nimsFound(db, limit, { cohortYear: 2024 })).toEqual([
        "9900000321",
        "9900000324",
      ]);
      expect(
        await nimsFound(db, limit, { cohortYear: 2024, query: "saring" }),
      ).toEqual(["9900000321"]);
      expect(
        await nimsFound(db, limit, { cohortYear: 2024, status: "inactive" }),
      ).toEqual([]);
    });
  });

  it("never finds a row outside what the account may see", async () => {
    await inTestDatabase(async (db) => {
      await addFilterRows(db);
      const other = await addTestProgram(db, "Prodi Uji Saring Lain");

      const found = await nimsFound(db, onlyProgram(other), {
        query: "Saring",
        status: "all",
      });

      expect(found).toEqual([]);
    });
  });
});

describe("listCohortYears", () => {
  it("gives the angkatan of the students the account may see, the newest first", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addFilterRows(db);
      const other = await addTestProgram(db, "Prodi Uji Angkatan Lain");
      await addTestStudent(db, other, {
        nim: "9900000325",
        name: "Angkatan Lain",
        cohortYear: 2021,
      });

      expect(await listCohortYears(db, limit)).toEqual([2026, 2024]);
    });
  });
});
