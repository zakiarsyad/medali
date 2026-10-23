// Sample Tahun akademik of this file: 3360 to 3361.
// Sample NIMs of this file: 9986560000 to 9986560099.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { BAM_ROLES } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormResidentChoices, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addTestScreening } from "@/features/counselling/test-screenings";
import { type DashboardFilters, NO_FILTERS } from "./dashboard-address";
import {
  dashboardKindsOf,
  kindToShow,
  readDashboardKind,
} from "./dashboard-kind";
import { type DashboardScope, dashboardScopeOf } from "./dashboard-scope";
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

function accountOf(roles: RoleId[], programId: number): AccountForAccess {
  return {
    id: crypto.randomUUID(),
    roles,
    studyProgramId: programId,
    studentId: null,
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

  it("gives Ketua Program Studi only their own program, in every number and every count beside a choice, also when they ask for another program by hand", async () => {
    await inTestDatabase(async (db) => {
      const { programId, otherProgramId } = await addRecords(db);
      const scope = dashboardScopeOf(accountOf(["head_of_program"], programId));
      if (scope === null) throw new Error("Ketua Program Studi was refused.");
      const both = {
        ...programScope(programId),
        visible: inArray(students.studyProgramId, [programId, otherProgramId]),
      };
      const asked: Partial<DashboardFilters> = {
        dorm: "dana_rakca",
        studyProgramId: otherProgramId,
      };

      const own = await loadWith(db, scope, asked);
      const wider = await loadWith(db, both, { dorm: "dana_rakca" });

      expect(own.programs).toBeNull();
      expect(own.filters.studyProgramId).toBeNull();
      expect(own.filters.dorm).toBe("dana_rakca");
      expect(own.counts.matching).toBe(3);
      expect(own.counts.dorms.get("dana_rakca")).toBe(3);
      expect(own.counts.dorms.get("semua")).toBe(6);
      expect(own.counts.programs).toEqual(new Map([[programId, 3]]));
      expect(own.mentoring.numbers.everyone).toBe(11);
      expect(wider.counts.dorms.get("dana_rakca")).toBe(4);
    });
  });

  it("refuses Konselor, Mahasiswa, Pegawai UPK, Pengelola Asrama and every BAM role asking by hand with the Asrama filter, as without it", () => {
    const refused: RoleId[] = [
      "counsellor",
      "student",
      "upk_staff",
      "dorm_manager",
      ...BAM_ROLES,
    ];
    const asked = readDashboardKind({ tampilan: "karakter", asrama: "semua" });

    for (const role of refused) {
      const account = accountOf([role], 1);

      expect(kindToShow(dashboardKindsOf([role]), asked), role).toBeNull();
      expect(dashboardScopeOf(account), role).toBeNull();
    }
  });

  it("follows a student who stops being a resident on the next load", async () => {
    await inTestDatabase(async (db) => {
      const { programId, danaRakca } = await addRecords(db);
      const scope = programScope(programId);
      const [leaving] = danaRakca;
      if (leaving === undefined) throw new Error("No resident was added.");
      const before = await loadWith(db, scope, { dorm: "dana_rakca" });
      await db.insert(dormResidentChoices).values({
        studentId: leaving,
        dorm: null,
        setBy: await addTestAccount(db, "Pengelola Uji Asrama Dashboard"),
        setAt: new Date("3361-10-01T03:00:00Z"),
      });

      const after = await loadWith(db, scope, { dorm: "dana_rakca" });

      expect(before.counts.matching).toBe(3);
      expect(after.counts.matching).toBe(2);
      expect(after.counts.dorms.get("dana_rakca")).toBe(2);
      expect(after.counts.dorms.get("semua")).toBe(5);
      expect(after.counts.dorms.get("non")).toBe(6);
    });
  });
});
