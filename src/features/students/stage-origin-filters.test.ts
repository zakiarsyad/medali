import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { stageCohorts } from "./stage-cohorts";
import { countChoices } from "./student-choice-counts";
import { listStudents } from "./student-list";
import {
  NO_AGENCY,
  NO_FILTERS,
  type StudentListFilters,
} from "./student-list-address";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const TAX = "Direktorat Jenderal Pajak";
const CUSTOMS = "Direktorat Jenderal Bea dan Cukai";

/** In this period angkatan 2026 is in tahap 1, 2025 in 2 and 2023 in 4. */
const COHORTS = stageCohorts([2026, 2025, 2023], {
  startYear: 2026,
  term: "odd",
});
const NO_PERIOD = stageCohorts([2026, 2025, 2023], null);

/** One program with students of three tahap, of every status. */
async function addRows(db: Database): Promise<RowLimit> {
  const program = await addTestProgram(db, "Prodi Uji Tahap");
  const rows = [
    { nim: "9900000401", name: "Tahap Satu Aktif", province: "Bali" },
    {
      nim: "9900000402",
      name: "Tahap Satu Cuti",
      status: "on_leave" as const,
      province: "Aceh",
    },
    {
      nim: "9900000403",
      name: "Tahap Satu Nonaktif",
      status: "inactive" as const,
      province: "Bali",
    },
    {
      nim: "9900000404",
      name: "Tahap Dua Alih",
      cohortYear: 2025,
      entryPath: "transfer" as const,
      originAgency: TAX,
      province: "Bali",
    },
    {
      nim: "9900000405",
      name: "Tahap Empat Alih",
      cohortYear: 2023,
      entryPath: "transfer" as const,
      originAgency: CUSTOMS,
    },
  ];
  for (const row of rows) await addTestStudent(db, program, row);
  return {
    kind: "some",
    studyProgramIds: [program],
    menteesOf: [],
    studentIds: [],
  };
}

/**
 * One program with a reguler student, and two alih program students: one
 * with no instansi kept, which the input rules allow, and one with one.
 */
async function addRowsWithBlankAgency(db: Database): Promise<RowLimit> {
  const program = await addTestProgram(db, "Prodi Uji Instansi");
  const rows = [
    { nim: "9900000406", name: "Alih Tanpa Instansi", entryPath: "transfer" },
    { nim: "9900000407", name: "Reguler Tanpa Instansi" },
    {
      nim: "9900000408",
      name: "Alih Dengan Instansi",
      entryPath: "transfer",
      originAgency: TAX,
    },
  ] as const;
  for (const row of rows) await addTestStudent(db, program, row);
  return {
    kind: "some",
    studyProgramIds: [program],
    menteesOf: [],
    studentIds: [],
  };
}

async function nimsFound(
  db: Database,
  limit: RowLimit,
  filters: Partial<StudentListFilters>,
  cohorts = COHORTS,
): Promise<string[]> {
  const all = { ...NO_FILTERS, ...filters };
  const listed = await listStudents(db, limit, all, 1, cohorts);
  return listed.students.map((student) => student.nim).sort();
}

describe("the Tahapan filter", () => {
  it("finds the Aktif and Cuti students of the tahap", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(await nimsFound(db, limit, { stageNo: 1 })).toEqual([
        "9900000401",
        "9900000402",
      ]);
      expect(await nimsFound(db, limit, { stageNo: 2 })).toEqual([
        "9900000404",
      ]);
      expect(await nimsFound(db, limit, { stageNo: 3 })).toEqual([]);
    });
  });

  it("never finds a Non aktif student, whatever the status asks for", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(await nimsFound(db, limit, { stageNo: 1, status: "all" })).toEqual(
        ["9900000401", "9900000402"],
      );
      expect(
        await nimsFound(db, limit, { stageNo: 1, status: "inactive" }),
      ).toEqual([]);
    });
  });

  it("finds nobody while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(await nimsFound(db, limit, { stageNo: 1 }, NO_PERIOD)).toEqual([]);
    });
  });
});

describe("the Provinsi and Instansi filters", () => {
  it("find the students of a provinsi, and none without one", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(await nimsFound(db, limit, { province: "Bali" })).toEqual([
        "9900000401",
        "9900000404",
      ]);
      expect(await nimsFound(db, limit, { province: "Papua" })).toEqual([]);
    });
  });

  it("find the students of an instansi, or those of none", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(await nimsFound(db, limit, { originAgency: TAX })).toEqual([
        "9900000404",
      ]);
      expect(await nimsFound(db, limit, { originAgency: NO_AGENCY })).toEqual([
        "9900000401",
        "9900000402",
      ]);
    });
  });

  it("find every student with no instansi under Tanpa instansi, alih program too", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRowsWithBlankAgency(db);

      expect(await nimsFound(db, limit, { originAgency: NO_AGENCY })).toEqual([
        "9900000406",
        "9900000407",
      ]);
    });
  });

  it("work together with the filters already there and the search", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      expect(
        await nimsFound(db, limit, {
          stageNo: 2,
          province: "Bali",
          originAgency: TAX,
          entryPath: "transfer",
          query: "alih",
        }),
      ).toEqual(["9900000404"]);
      expect(
        await nimsFound(db, limit, { stageNo: 1, province: "Bali" }),
      ).toEqual(["9900000401"]);
      expect(
        await nimsFound(db, limit, { stageNo: 1, originAgency: TAX }),
      ).toEqual([]);
    });
  });
});

describe("the counts of Tahapan, Provinsi and Instansi", () => {
  it("say how many students each choice holds", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      const counts = await countChoices(db, limit, NO_FILTERS, COHORTS);

      expect(counts.stages).toEqual(
        new Map([
          [1, 2],
          [2, 1],
          [4, 1],
        ]),
      );
      expect(counts.provinces).toEqual(
        new Map([
          ["Aceh", 1],
          ["Bali", 2],
        ]),
      );
      expect(counts.agencies).toEqual(
        new Map([
          [NO_AGENCY, 2],
          [TAX, 1],
          [CUSTOMS, 1],
        ]),
      );
    });
  });

  it("count every student with no instansi under Tanpa instansi, alih program too", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRowsWithBlankAgency(db);

      const counts = await countChoices(db, limit, NO_FILTERS, COHORTS);

      expect(counts.agencies).toEqual(
        new Map([
          [NO_AGENCY, 2],
          [TAX, 1],
        ]),
      );
    });
  });

  it("count a choice with the other filters applied, and without its own", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      const counts = await countChoices(
        db,
        limit,
        { ...NO_FILTERS, status: "all", stageNo: 1, province: "Bali" },
        COHORTS,
      );

      expect(counts.stages).toEqual(
        new Map([
          [1, 1],
          [2, 1],
          [4, 0],
        ]),
      );
      expect(counts.provinces).toEqual(
        new Map([
          ["Aceh", 1],
          ["Bali", 1],
        ]),
      );
      expect(counts.agencies).toEqual(new Map([[NO_AGENCY, 1]]));
      expect(counts.entryPaths).toEqual({ regular: 1, transfer: 0 });
    });
  });

  it("offer no tahap while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const limit = await addRows(db);

      const counts = await countChoices(db, limit, NO_FILTERS, NO_PERIOD);

      expect(counts.stages).toEqual(new Map());
    });
  });
});
