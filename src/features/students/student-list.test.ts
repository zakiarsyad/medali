import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { PAGE_SIZE } from "@/ui/list-pages";
import { countChoices } from "./student-choice-counts";
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
  const all = { ...NO_FILTERS, ...filters };
  const listed = await listStudents(db, limit, all, 1);
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

      const listed = await listStudents(
        db,
        onlyProgram(program),
        ALL_STATUSES,
        1,
      );

      expect(listed.students).toEqual([
        {
          nim: "9900000311",
          name: "Tabel Uji Ani",
          status: "active",
          isAffirmation: false,
          isSeedling: true,
          isInternational: false,
          isBlended: false,
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

      const forAll = await listStudents(db, EVERYONE, NO_FILTERS, 1);
      const forOwn = await listStudents(db, onlyProgram(own), NO_FILTERS, 1);

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

/** Two programs with students of both jalur and of some kategori. */
async function addChoiceRows(db: Database) {
  const first = await addTestProgram(db, "Prodi Uji Pilih Satu");
  const second = await addTestProgram(db, "Prodi Uji Pilih Dua");
  await addTestStudent(db, first, {
    nim: "9900000331",
    name: "Pilih Reguler Afirmasi",
    isAffirmation: true,
  });
  await addTestStudent(db, first, {
    nim: "9900000332",
    name: "Pilih Alih Blended",
    entryPath: "transfer",
    isBlended: true,
  });
  await addTestStudent(db, second, {
    nim: "9900000333",
    name: "Pilih Reguler Afirmasi Bibit",
    isAffirmation: true,
    isSeedling: true,
  });
  await addTestStudent(db, second, {
    nim: "9900000334",
    name: "Pilih Nonaktif",
    status: "inactive",
    isInternational: true,
  });
  const limit: RowLimit = {
    kind: "some",
    studyProgramIds: [first, second],
    menteesOf: [],
    studentIds: [],
  };
  return { first, second, limit };
}

describe("the Program studi, Jalur and Kategori filters", () => {
  it("each narrow the list, and work together", async () => {
    await inTestDatabase(async (db) => {
      const { first, second, limit } = await addChoiceRows(db);

      expect(await nimsFound(db, limit, { studyProgramId: first })).toEqual([
        "9900000331",
        "9900000332",
      ]);
      expect(await nimsFound(db, limit, { entryPath: "transfer" })).toEqual([
        "9900000332",
      ]);
      expect(await nimsFound(db, limit, { category: "isAffirmation" })).toEqual(
        ["9900000331", "9900000333"],
      );
      expect(
        await nimsFound(db, limit, {
          studyProgramId: second,
          entryPath: "regular",
          category: "isAffirmation",
          query: "bibit",
        }),
      ).toEqual(["9900000333"]);
      expect(
        await nimsFound(db, limit, {
          studyProgramId: first,
          category: "isSeedling",
        }),
      ).toEqual([]);
    });
  });
});

describe("countChoices", () => {
  it("counts the students each choice holds", async () => {
    await inTestDatabase(async (db) => {
      const { first, second, limit } = await addChoiceRows(db);

      const counts = await countChoices(db, limit, NO_FILTERS);

      expect(counts.programs).toEqual(
        new Map([
          [first, 2],
          [second, 1],
        ]),
      );
      expect(counts.entryPaths).toEqual({ regular: 2, transfer: 1 });
      expect(counts.categories).toEqual({
        isAffirmation: 2,
        isSeedling: 1,
        isInternational: 0,
        isBlended: 1,
      });
    });
  });

  it("counts a choice with the other filters applied, and without its own", async () => {
    await inTestDatabase(async (db) => {
      const { first, second, limit } = await addChoiceRows(db);

      const counts = await countChoices(db, limit, {
        ...NO_FILTERS,
        status: "all",
        studyProgramId: second,
        entryPath: "regular",
      });

      expect(counts.programs).toEqual(
        new Map([
          [first, 1],
          [second, 2],
        ]),
      );
      expect(counts.entryPaths).toEqual({ regular: 2, transfer: 0 });
      expect(counts.categories).toEqual({
        isAffirmation: 1,
        isSeedling: 1,
        isInternational: 1,
        isBlended: 0,
      });
    });
  });

  it("counts only the rows the account may see", async () => {
    await inTestDatabase(async (db) => {
      const { first } = await addChoiceRows(db);

      const counts = await countChoices(db, onlyProgram(first), NO_FILTERS);

      expect(counts.programs).toEqual(new Map([[first, 2]]));
      expect(counts.entryPaths).toEqual({ regular: 1, transfer: 1 });
    });
  });
});

describe("the pages of listStudents", () => {
  /** One more student than two pages hold, and one the filters leave out. */
  async function addPagedRows(db: Database): Promise<RowLimit> {
    const program = await addTestProgram(db, "Prodi Uji Halaman");
    for (let place = 0; place <= 2 * PAGE_SIZE; place++) {
      await addTestStudent(db, program, {
        nim: String(9900200000 + place),
        name: `Halaman Uji ${String(place).padStart(2, "0")}`,
      });
    }
    await addTestStudent(db, program, {
      nim: "9900200099",
      name: "Halaman Uji Nonaktif",
      status: "inactive",
    });
    return onlyProgram(program);
  }

  it("gives 25 rows a page, and how many match in all", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addPagedRows(db);

      const first = await listStudents(db, limit, NO_FILTERS, 1);
      const second = await listStudents(db, limit, NO_FILTERS, 2);
      const third = await listStudents(db, limit, NO_FILTERS, 3);

      expect(first.matching).toBe(2 * PAGE_SIZE + 1);
      expect(first.students).toHaveLength(PAGE_SIZE);
      expect(first.students[0]?.name).toBe("Halaman Uji 00");
      expect(second.students[0]?.name).toBe("Halaman Uji 25");
      expect(second.page).toBe(2);
      expect(third.students.map((s) => s.name)).toEqual(["Halaman Uji 50"]);
    });
  });

  it("gives the last page for a page past it", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addPagedRows(db);

      const listed = await listStudents(db, limit, NO_FILTERS, 99);

      expect(listed.page).toBe(3);
      expect(listed.students).toHaveLength(1);
    });
  });

  it("gives an empty first page when nothing matches", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addPagedRows(db);
      const filters = { ...NO_FILTERS, query: "tidak ada yang begini" };

      const listed = await listStudents(db, limit, filters, 2);

      expect(listed).toEqual({ students: [], matching: 0, page: 1 });
    });
  });
});
