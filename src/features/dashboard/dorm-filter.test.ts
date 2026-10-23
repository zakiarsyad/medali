// Sample Tahun akademik of this file: 3360 to 3361.
// Sample NIMs of this file: 9986560000 to 9986560099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addTestScreening } from "@/features/counselling/test-screenings";
import { type DashboardFilters, NO_FILTERS } from "./dashboard-address";
import type { DashboardScope } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";
import {
  addTestAccount,
  addTestAssessment,
  addTestFitnessScores,
  addTestPeriod,
  evenScores,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** Angkatan 3361 is in semester 1 and lives in the dorm; 3360 is in semester 3. */
const ODD_3361 = { startYear: 3361, term: "odd" } as const;
/** A day of that Ganjil, which gives the character grades. */
const TODAY = "3361-10-01";
const ASSESSED_AT = new Date("3361-09-15T03:00:00Z");

/**
 * In one program: three Reguler women of semester 1 in Dana Rakca, one
 * Reguler man of semester 1 in Cipta Bakti, a Pembibitan woman and an
 * Internasional man of semester 3 in Wismantara, five Reguler women of
 * semester 3 in no dorm, and a woman of semester 1 on Cuti, who never
 * counts. In another program one woman of semester 1 in Dana Rakca.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Asrama Dashboard");
  const otherProgramId = await addTestProgram(
    db,
    "Prodi Uji Asrama Dashboard Lain",
  );
  let next = 0;
  const add = (more: Partial<typeof students.$inferInsert> = {}) => {
    next += 1;
    const nim = `99865600${String(next).padStart(2, "0")}`;
    return addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji Asrama ${nim}`,
      cohortYear: 3361,
      ...more,
    });
  };
  const danaRakca = [await add(), await add(), await add()];
  const ciptaBakti = await add({ sex: "male" });
  const wismantara = [
    await add({ cohortYear: 3360, isSeedling: true }),
    await add({ cohortYear: 3360, sex: "male", isInternational: true }),
  ];
  const outside = [];
  for (let place = 0; place < 5; place += 1) {
    outside.push(await add({ cohortYear: 3360 }));
  }
  await add({ status: "on_leave" });
  await addTestStudent(db, otherProgramId, {
    nim: "9986560099",
    name: "Mahasiswa Uji Asrama Lain",
    cohortYear: 3361,
  });
  return {
    programId,
    otherProgramId,
    danaRakca,
    ciptaBakti,
    wismantara,
    outside,
  };
}

/** An assessment, a fitness score and a screening for each student. */
async function addResults(db: Database, studentIds: string[]): Promise<void> {
  const periodId = await addTestPeriod(db, 3361);
  const by = await addTestAccount(db, "Penilai Uji Asrama Dashboard");
  for (const studentId of studentIds) {
    await addTestAssessment(db, {
      studentId,
      periodId,
      enteredBy: by,
      enteredAt: ASSESSED_AT,
      scores: evenScores(80),
    });
    await addTestScreening(db, studentId, by, { level: "normal" });
  }
  await addTestFitnessScores(
    db,
    by,
    studentIds.map((studentId) => ({ studentId, score: 90 })),
  );
}

/** Every number the value holds, however deep. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numbersIn);
}

function programScope(programId: number): DashboardScope {
  return {
    visible: eq(students.studyProgramId, programId),
    picksProgram: true,
    illnesses: null,
    shared: null,
    notes: null,
    detail: null,
  };
}

function loadWith(
  db: Database,
  scope: DashboardScope,
  asked: Partial<DashboardFilters> = {},
) {
  return loadDashboard(db, scope, { ...NO_FILTERS, ...asked }, ODD_3361, TODAY);
}

describe("the Asrama filter of Dashboard pembangunan karakter", () => {
  it("counts the Aktif students under each Asrama choice, Semua asrama as the sum of the dorms", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);

      const view = await loadWith(db, programScope(programId));

      expect(view.counts.matching).toBe(11);
      expect(view.counts.dorms).toEqual(
        new Map([
          ["semua", 6],
          ["wismantara", 2],
          ["dana_rakca", 3],
          ["cipta_bakti", 1],
          ["non", 5],
        ]),
      );
    });
  });

  it("counts each Asrama choice with the other filters as they are", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);

      const stageTwo = await loadWith(db, programScope(programId), {
        stageNo: 2,
      });

      expect(stageTwo.counts.dorms).toEqual(
        new Map([
          ["semua", 2],
          ["wismantara", 2],
          ["dana_rakca", 0],
          ["cipta_bakti", 0],
          ["non", 5],
        ]),
      );
    });
  });

  it("counts every card and section only for the students of the Asrama choice", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { programId, danaRakca, ciptaBakti, wismantara, outside } = records;
      await addResults(db, [
        ...danaRakca,
        ciptaBakti,
        ...wismantara,
        ...outside,
      ]);
      const scope = programScope(programId);

      const residents = await loadWith(db, scope, { dorm: "semua" });
      const others = await loadWith(db, scope, { dorm: "non" });

      expect(residents.counts.matching).toBe(6);
      expect(residents.achievement.recap).toMatchObject({
        students: 6,
        assessed: 6,
      });
      expect(residents.physical).toMatchObject({
        kind: "shown",
        students: 6,
        tested: 6,
      });
      expect(residents.mental.recap).toMatchObject({
        kind: "shown",
        assessed: 6,
      });
      expect(residents.mentoring.numbers.everyone).toBe(11);
      expect(others.counts.matching).toBe(5);
      expect(others.achievement.recap).toMatchObject({ students: 5 });
      expect(others.physical).toMatchObject({ kind: "shown", students: 5 });
    });
  });

  it("gives no average and no health or mental health count for a dorm with fewer than 5 students, and the server sends none", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { programId, danaRakca, ciptaBakti, wismantara, outside } = records;
      await addResults(db, [
        ...danaRakca,
        ciptaBakti,
        ...wismantara,
        ...outside,
      ]);

      const view = await loadWith(db, programScope(programId), {
        dorm: "dana_rakca",
      });

      expect(view.counts.matching).toBe(3);
      expect(view.achievement).toEqual({ recap: null, cohorts: [] });
      expect(view.grades.recap.kind).not.toBe("shown");
      expect(view.grades.cohorts).toEqual([]);
      expect(view.physical).toEqual({ kind: "too_few", students: 3 });
      expect(view.mental.recap).toEqual({ kind: "too_few" });
      expect(
        numbersIn([view.achievement, view.grades.recap, view.mental.recap]),
      ).toEqual([]);
    });
  });
});
