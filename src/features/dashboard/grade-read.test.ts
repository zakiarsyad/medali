// Sample Tahun akademik of this file: 4530 to 4530.
// Sample NIMs of this file: 9986530000 to 9986530099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { FORTY_TWENTY } from "@/character-grades/test-weights";
import type { Database } from "@/db/connect";
import { characterGradeSchemes, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPenaltyOf } from "@/discipline-penalties/test-penalties";
import {
  addTestActivity,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { addTestScore } from "@/features/mentoring/test-scores";
import { addTestActor, addTestUpload } from "@/features/skpm/test-skpm";
import { NO_FILTERS } from "./dashboard-address";
import { dashboardScopeOf } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";

const inTestDatabase = withTestDatabase();

const ODD_4530 = { startYear: 4530, term: "odd" } as const;
/** A day of Ganjil 4530/4531, which runs then. */
const TODAY = "4530-10-20";

type TestStudent = { nim: string } & Partial<typeof students.$inferInsert>;

/**
 * In one program, of angkatan 4529: five who score 100, 80, 65 and 72,
 * which give 79,3 and B, the last of them held at 70 by a Ringan penalty;
 * one who scores 0, 80, 65 and 0, which give 36,3 and E; one with no
 * Pengasuhan score, so "Belum lengkap", also held at 70; and one on Cuti,
 * who never counts. The first three are from Bali, the rest from Jawa
 * Barat. In another program one more student the scope does not see.
 */
async function addRecords(db: Database) {
  const { oddId: periodId } = await addTestPeriods(db, 4530);
  const programId = await addTestProgram(db, "UJINILAIDASHBOARD");
  const otherId = await addTestProgram(db, "UJINILAIDASHBOARDB");
  const kepala = await addTestActor(db, "Kepala Uji Nilai Dashboard", [
    "head_of_unit",
  ]);
  let next = 0;
  const add = async (program: number, more: Partial<TestStudent> = {}) => {
    next += 1;
    const nim = `99865300${String(next).padStart(2, "0")}`;
    const added = await addTestStudentAccount(db, program, {
      nim,
      name: `Mahasiswa Uji Nilai Dashboard ${nim}`,
      cohortYear: 4529,
      province: "Jawa Barat",
      ...more,
    });
    return added.studentId;
  };
  const passing: string[] = [];
  for (let place = 0; place < 5; place += 1) {
    passing.push(await add(programId, place < 3 ? { province: "Bali" } : {}));
  }
  const failing = await add(programId);
  const incomplete = await add(programId, { entryPath: "transfer" });
  const away = await add(programId, { status: "on_leave" });
  const other = await add(otherId);
  const scheduleId = await addTestSchedule(db, {
    activityId: await addTestActivity(db, kepala.id),
    academicPeriodId: periodId,
    changedBy: kepala.id,
    startsOn: "4530-10-01",
  });
  const attending = [...passing, incomplete, away, other];
  for (const studentId of attending) {
    await addTestAttendance(db, kepala.id, {
      scheduleId,
      studentId,
      status: "valid",
    });
  }
  for (const studentId of [...passing, failing, away, other]) {
    await addTestScore(db, {
      studentId,
      periodId,
      score: 80,
      scoredBy: kepala.id,
    });
  }
  await addTestUpload(db, kepala, {
    mode: "add",
    periodId,
    enteredAt: new Date("4530-10-10T03:00:00Z"),
    rows: attending.map((studentId) => ({ studentId, points: 36 })),
  });
  const ringan = { category: "light", level: 1 } as const;
  for (const studentId of [passing[4], incomplete]) {
    if (studentId === undefined) throw new Error("No student was added.");
    await addTestPenaltyOf(db, studentId, kepala.id, ringan, "4530-09-01");
  }
  return {
    programId,
    kepala,
    scope: {
      visible: eq(students.studyProgramId, programId),
      picksProgram: true,
      illnesses: null,
    },
  };
}

function accountOf(roles: RoleId[], programId: number) {
  return {
    id: crypto.randomUUID(),
    roles,
    studyProgramId: programId,
    studentId: null,
  };
}

/** Every number the value holds, however deep. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numbersIn);
}

describe("Nilai karakter of Dashboard pembangunan karakter", () => {
  it("averages the worked-out grades of the Aktif students the account sees, held at 70 where limited", async () => {
    await inTestDatabase(async (db) => {
      const { scope } = await addRecords(db);

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_4530, TODAY);

      expect(view.grades.scheme.passLetter).toBe("B");
      expect(view.grades.recap).toEqual({
        kind: "shown",
        graded: 6,
        limited: 2,
        meanFinal: 70.6,
        passing: 83,
        letters: { A: 0, B: 5, C: 0, D: 0, E: 1 },
        incomplete: 1,
        parts: { attendance: 500 / 6, mentoring: 80, siku: 65, skpm: 60 },
      });
    });
  });

  it("gives Ketua Program Studi the grades of their own program only", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const scope = dashboardScopeOf(accountOf(["head_of_program"], programId));
      if (scope === null) throw new Error("Ketua Program Studi was refused.");

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_4530, TODAY);

      expect(view.grades.recap).toMatchObject({ kind: "shown", graded: 6 });
    });
  });

  it("sends no number of a filtered group with fewer than 5 worked-out grades", async () => {
    await inTestDatabase(async (db) => {
      const { scope } = await addRecords(db);

      const bali = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, province: "Bali" },
        ODD_4530,
        TODAY,
      );

      expect(bali.counts.matching).toBe(3);
      expect(bali.grades.recap).toEqual({ kind: "too_few" });
      expect(numbersIn(bali.grades.recap)).toEqual([]);
    });
  });

  it("says there is no grade, with no number, for a group whose grades are all Belum lengkap", async () => {
    await inTestDatabase(async (db) => {
      const { scope } = await addRecords(db);

      const transfer = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, entryPath: "transfer" },
        ODD_4530,
        TODAY,
      );

      expect(transfer.counts.matching).toBe(1);
      expect(transfer.grades.recap).toEqual({ kind: "none" });
    });
  });

  it("works Nilai akhir and the letters out by the weights, limits and pass letter in force on the next load", async () => {
    await inTestDatabase(async (db) => {
      const { scope, kepala } = await addRecords(db);
      await db.insert(characterGradeSchemes).values({
        attendanceWeight: 40,
        mentoringWeight: 20,
        sikuWeight: 20,
        skpmWeight: 20,
        aFrom: 90,
        bFrom: 80,
        cFrom: 75,
        dFrom: 60,
        passLetter: "C",
        before: STARTING_SCHEME,
        setBy: kepala.id,
        setAt: new Date("4530-10-15T03:00:00Z"),
      });

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_4530, TODAY);

      expect(view.grades.scheme.weights).toEqual(FORTY_TWENTY);
      expect(view.grades.scheme.passLetter).toBe("C");
      expect(view.grades.recap).toMatchObject({
        meanFinal: 72.1,
        passing: 67,
        letters: { A: 0, B: 4, C: 0, D: 1, E: 1 },
      });
    });
  });

  it("refuses Penilai Mahasiswa and Pegawai UPK, so no grade number is read for them", () => {
    for (const role of ["assessor", "upk_staff"] as const) {
      expect(dashboardScopeOf(accountOf([role], 1))).toBeNull();
    }
  });
});
