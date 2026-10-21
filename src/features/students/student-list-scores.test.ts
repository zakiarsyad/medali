// Sample Tahun akademik of this file: 4501 to 4501.
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { PAGE_SIZE } from "@/ui/list-pages";
import type { ListCohorts } from "./list-cohorts";
import { countChoices } from "./student-choice-counts";
import { listStudents } from "./student-list";
import {
  NO_FILTERS,
  NOT_ASSESSED_CHOICE,
  type StudentListFilters,
} from "./student-list-address";
import { readListScores, scoreFilterOf } from "./student-list-scores";
import {
  addTestActor,
  addTestAssessment,
  addTestPeriod,
  addTestProgram,
  addTestStudent,
} from "./test-records";

// Sample NIMs of this file: 9989310000 to 9989310099.

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 4501/4502, which runs then. */
const TODAY = "4501-10-20";

const NO_STAGES = { stages: new Map(), dorms: [] };

function evenly(score: number): Scores {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
}

/**
 * Emas Ani; Perak Budi; Citra, Emas before and Perlu pembinaan in her
 * latest; Dodi, never assessed; and Eka of another program, Emas.
 */
async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 4501);
  const programId = await addTestProgram(db, "Prodi Uji Predikat Daftar");
  const otherId = await addTestProgram(db, "Prodi Uji Predikat Lain");
  const kepala = await addTestActor(db, "Kepala Uji Predikat", [
    "head_of_unit",
  ]);
  const add = (program: number, nim: string, name: string) =>
    addTestStudent(db, program, { nim, name });
  const ani = await add(programId, "9989310001", "Predikat Ani");
  const budi = await add(programId, "9989310002", "Predikat Budi");
  const citra = await add(programId, "9989310003", "Predikat Citra");
  const dodi = await add(programId, "9989310004", "Predikat Dodi");
  const eka = await add(otherId, "9989310005", "Predikat Eka");
  const assess = (studentId: string, score: number, day: string) =>
    addTestAssessment(db, kepala.id, {
      studentId,
      periodId,
      enteredAt: new Date(`${day}T03:00:00Z`),
      scores: evenly(score),
    });
  await assess(ani, 90, "4501-09-01");
  await assess(budi, 80, "4501-09-01");
  await assess(citra, 90, "4501-09-01");
  await assess(citra, 60, "4501-10-01");
  await assess(eka, 90, "4501-09-01");
  return { periodId, programId, kepala, ani, budi, citra, dodi, eka };
}

async function cohortsFor(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<ListCohorts> {
  const scored = await scoreFilterOf(db, limit, filters, TODAY);
  return { ...NO_STAGES, scored };
}

async function namesFound(
  db: Database,
  limit: RowLimit,
  chosen: Partial<StudentListFilters>,
): Promise<string[]> {
  const filters = { ...NO_FILTERS, ...chosen };
  const cohorts = await cohortsFor(db, limit, filters);
  const listed = await listStudents(db, limit, filters, 1, cohorts);
  return listed.students.map((student) => student.name);
}

describe("the predikat filter of the list", () => {
  it("finds the students whose latest assessment has the predikat, and those with none", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const limit = onlyProgram(records.programId);

      expect(await namesFound(db, limit, { predicate: "gold" })).toEqual([
        "Predikat Ani",
      ]);
      expect(await namesFound(db, limit, { predicate: "silver" })).toEqual([
        "Predikat Budi",
      ]);
      expect(await namesFound(db, limit, { predicate: "guidance" })).toEqual([
        "Predikat Citra",
      ]);
      expect(await namesFound(db, limit, { predicate: "bronze" })).toEqual([]);
      expect(
        await namesFound(db, limit, { predicate: NOT_ASSESSED_CHOICE }),
      ).toEqual(["Predikat Dodi"]);
      expect(await namesFound(db, limit, {})).toHaveLength(4);
    });
  });

  it("finds nobody outside the rows the account sees", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const names = await namesFound(db, onlyProgram(records.programId), {
        predicate: "gold",
      });

      expect(names).not.toContain("Predikat Eka");
    });
  });

  it("keeps 25 a page and counts every match, on every page", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      for (let place = 10; place < 10 + PAGE_SIZE + 5; place += 1) {
        const studentId = await addTestStudent(db, records.programId, {
          nim: `99893100${place}`,
          name: `Predikat Halaman ${place}`,
        });
        await addTestAssessment(db, records.kepala.id, {
          studentId,
          periodId: records.periodId,
          enteredAt: new Date("4501-09-02T03:00:00Z"),
          scores: evenly(80),
        });
      }
      const limit = onlyProgram(records.programId);
      const filters = { ...NO_FILTERS, predicate: "silver" as const };
      const cohorts = await cohortsFor(db, limit, filters);

      const first = await listStudents(db, limit, filters, 1, cohorts);
      const second = await listStudents(db, limit, filters, 2, cohorts);

      expect(first.matching).toBe(PAGE_SIZE + 6);
      expect(first.students).toHaveLength(PAGE_SIZE);
      expect(first.students[0]?.name).toBe("Predikat Budi");
      expect(second.students.map((each) => each.name)).toEqual([
        "Predikat Halaman 34",
        "Predikat Halaman 35",
        "Predikat Halaman 36",
        "Predikat Halaman 37",
        "Predikat Halaman 38",
        "Predikat Halaman 39",
      ]);
    });
  });

  it("counts the choices of the top bar within the chosen predikat", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const limit = onlyProgram(records.programId);
      const filters = { ...NO_FILTERS, predicate: "gold" as const };

      const counts = await countChoices(
        db,
        limit,
        filters,
        await cohortsFor(db, limit, filters),
      );

      expect(counts.programs.get(records.programId)).toBe(1);
    });
  });
});

describe("the grade filter of the list", () => {
  it("leaves out every student whose grade is Belum lengkap, from both choices", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const limit = onlyProgram(records.programId);

      expect(await namesFound(db, limit, { grade: "passing" })).toEqual([]);
      expect(await namesFound(db, limit, { grade: "failing" })).toEqual([]);
    });
  });

  it("asks nothing more of the database while neither choice is made", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(
        await scoreFilterOf(
          db,
          onlyProgram(records.programId),
          NO_FILTERS,
          TODAY,
        ),
      ).toBeUndefined();
    });
  });
});

describe("readListScores", () => {
  it("gives each student of the page the Rerata of their latest assessment and their grade", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const scores = await readListScores(
        db,
        onlyProgram(records.programId),
        [records.ani, records.citra, records.dodi],
        TODAY,
      );

      expect(scores.get(records.ani)).toEqual({
        rerata: 90,
        grade: { complete: false },
      });
      expect(scores.get(records.citra)?.rerata).toBe(60);
      expect(scores.get(records.dodi)).toEqual({
        rerata: null,
        grade: { complete: false },
      });
    });
  });

  it("reads nothing of a student outside the rows the account sees", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const scores = await readListScores(
        db,
        onlyProgram(records.programId),
        [records.eka],
        TODAY,
      );

      expect(scores.get(records.eka)).toEqual({
        rerata: null,
        grade: { complete: false },
      });
    });
  });
});
