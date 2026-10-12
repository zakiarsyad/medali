// Sample NIMs of this file: 9900400000 to 9900400199.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { PAGE_SIZE } from "@/ui/list-pages";
import type { ListCohorts } from "./list-cohorts";
import { countChoices } from "./student-choice-counts";
import { listStudents } from "./student-list";
import {
  NO_DORM,
  NO_FILTERS,
  type StudentListFilters,
} from "./student-list-address";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

/** Angkatan 2026 is in semester 1 and lives in the dorm; 2023 does not. */
const COHORTS: ListCohorts = { stages: new Map(), dorms: [2026] };
const NO_PERIOD: ListCohorts = { stages: new Map(), dorms: [] };

const ALL_STATUSES: StudentListFilters = { ...NO_FILTERS, status: "all" };

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

/** One program with a resident of each dorm, and three who live in none. */
async function addRows(db: Database, programName: string): Promise<number> {
  const program = await addTestProgram(db, programName);
  const rows = [
    { nim: "9900400001", name: "Asrama Dana" },
    { nim: "9900400002", name: "Asrama Cipta", sex: "male" },
    {
      nim: "9900400003",
      name: "Asrama Wisma Putri",
      cohortYear: 2023,
      isSeedling: true,
    },
    {
      nim: "9900400004",
      name: "Asrama Wisma Putra",
      cohortYear: 2023,
      sex: "male",
      entryPath: "transfer",
      isInternational: true,
    },
    { nim: "9900400005", name: "Luar Semester Lanjut", cohortYear: 2023 },
    { nim: "9900400006", name: "Luar Cuti", status: "on_leave" },
    { nim: "9900400007", name: "Luar Non Aktif", status: "inactive" },
  ] as const;
  for (const row of rows) await addTestStudent(db, program, row);
  return program;
}

async function nimsFound(
  db: Database,
  limit: RowLimit,
  filters: Partial<StudentListFilters>,
  cohorts = COHORTS,
): Promise<string[]> {
  const all = { ...ALL_STATUSES, ...filters };
  const listed = await listStudents(db, limit, all, 1, cohorts);
  return listed.students.map((student) => student.nim).sort();
}

describe("the Asrama filter", () => {
  it("finds only the residents of the dorm chosen", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      expect(await nimsFound(db, limit, { dorm: "dana_rakca" })).toEqual([
        "9900400001",
      ]);
      expect(await nimsFound(db, limit, { dorm: "cipta_bakti" })).toEqual([
        "9900400002",
      ]);
      expect(await nimsFound(db, limit, { dorm: "wismantara_putri" })).toEqual([
        "9900400003",
      ]);
      expect(await nimsFound(db, limit, { dorm: "wismantara_putra" })).toEqual([
        "9900400004",
      ]);
    });
  });

  it("finds everyone who lives in no dorm under Non asrama, whatever their status", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      expect(await nimsFound(db, limit, { dorm: NO_DORM })).toEqual([
        "9900400005",
        "9900400006",
        "9900400007",
      ]);
      expect(
        await nimsFound(db, limit, { dorm: NO_DORM, status: "current" }),
      ).toEqual(["9900400005", "9900400006"]);
    });
  });

  it("works together with the other filters and the search", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      expect(
        await nimsFound(db, limit, { dorm: "dana_rakca", query: "Asrama" }),
      ).toEqual(["9900400001"]);
      expect(
        await nimsFound(db, limit, { dorm: "dana_rakca", cohortYear: 2023 }),
      ).toEqual([]);
    });
  });

  it("counts only Internasional and Pembibitan as residents while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      expect(
        await nimsFound(db, limit, { dorm: "dana_rakca" }, NO_PERIOD),
      ).toEqual([]);
      expect(
        await nimsFound(db, limit, { dorm: "wismantara_putri" }, NO_PERIOD),
      ).toEqual(["9900400003"]);
    });
  });

  it("still gives Ketua Program Studi only their program, also when the request names another", async () => {
    await inTestDatabase(async (db) => {
      const own = await addRows(db, "Prodi Uji Asrama Sendiri");
      const other = await addTestProgram(db, "Prodi Uji Asrama Lain");
      await addTestStudent(db, other, {
        nim: "9900400011",
        name: "Asrama Dana Prodi Lain",
      });
      const limit = onlyProgram(own);

      expect(await nimsFound(db, limit, { dorm: "dana_rakca" })).toEqual([
        "9900400001",
      ]);
      expect(
        await nimsFound(db, limit, {
          dorm: "dana_rakca",
          studyProgramId: other,
        }),
      ).toEqual([]);
      const counts = await countChoices(
        db,
        limit,
        { ...ALL_STATUSES, studyProgramId: other },
        COHORTS,
      );
      expect(counts.dorms.dana_rakca).toBe(0);
    });
  });

  it("gives 25 rows a page, and how many match in all", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama Halaman");
      for (let place = 0; place <= PAGE_SIZE; place++) {
        await addTestStudent(db, program, {
          nim: String(9900400100 + place),
          name: `Asrama Halaman ${String(place).padStart(2, "0")}`,
        });
      }
      await addTestStudent(db, program, {
        nim: "9900400199",
        name: "Asrama Halaman Putra",
        sex: "male",
      });
      const filters = { ...ALL_STATUSES, dorm: "dana_rakca" as const };
      const limit = onlyProgram(program);

      const first = await listStudents(db, limit, filters, 1, COHORTS);
      const second = await listStudents(db, limit, filters, 2, COHORTS);

      expect(first.students).toHaveLength(PAGE_SIZE);
      expect(first.matching).toBe(PAGE_SIZE + 1);
      expect(second.students.map((student) => student.nim)).toEqual([
        "9900400125",
      ]);
    });
  });
});

describe("the Asrama tag", () => {
  it("names the dorm of each resident in the row, and none for the others", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      const listed = await listStudents(db, limit, ALL_STATUSES, 1, COHORTS);

      const dorms = listed.students.map((student) => [
        student.nim,
        student.dorm,
      ]);
      expect(dorms.sort()).toEqual([
        ["9900400001", "dana_rakca"],
        ["9900400002", "cipta_bakti"],
        ["9900400003", "wismantara_putri"],
        ["9900400004", "wismantara_putra"],
        ["9900400005", null],
        ["9900400006", null],
        ["9900400007", null],
      ]);
    });
  });
});

describe("a student who stops being a resident", () => {
  it("loses the tag and leaves the filter and its count on the next read", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));
      const inDorm = { dorm: "dana_rakca" as const };
      const before = await countChoices(db, limit, ALL_STATUSES, COHORTS);

      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.nim, "9900400001"));

      expect(await nimsFound(db, limit, inDorm)).toEqual([]);
      expect(await nimsFound(db, limit, { dorm: NO_DORM })).toContain(
        "9900400001",
      );
      const listed = await listStudents(db, limit, ALL_STATUSES, 1, COHORTS);
      const row = listed.students.find(
        (student) => student.nim === "9900400001",
      );
      expect(row?.dorm).toBeNull();
      const after = await countChoices(db, limit, ALL_STATUSES, COHORTS);
      expect(before.dorms.dana_rakca).toBe(1);
      expect(after.dorms.dana_rakca).toBe(0);
      expect(after.dorms[NO_DORM]).toBe(before.dorms[NO_DORM] + 1);
    });
  });
});

describe("the counts of the Asrama filter", () => {
  it("say how many students each choice holds", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      const counts = await countChoices(db, limit, ALL_STATUSES, COHORTS);

      expect(counts.dorms).toEqual({
        wismantara_putra: 1,
        wismantara_putri: 1,
        dana_rakca: 1,
        cipta_bakti: 1,
        [NO_DORM]: 3,
      });
    });
  });

  it("count a choice with the other filters applied, and without its own", async () => {
    await inTestDatabase(async (db) => {
      const limit = onlyProgram(await addRows(db, "Prodi Uji Asrama Saring"));

      const counts = await countChoices(
        db,
        limit,
        { ...NO_FILTERS, dorm: "dana_rakca" },
        COHORTS,
      );

      expect(counts.dorms.cipta_bakti).toBe(1);
      expect(counts.dorms[NO_DORM]).toBe(2);
      expect(counts.entryPaths).toEqual({ regular: 1, transfer: 0 });
    });
  });
});
