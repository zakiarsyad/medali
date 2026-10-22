// Sample Tahun akademik of this file: 3341 to 3341.
// Sample NIMs of this file: 9986510000 to 9986510099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { NO_FILTERS } from "./dashboard-address";
import { loadDashboard } from "./dashboard-view";
import {
  addTestAccount,
  addTestAssessment,
  addTestPeriod,
  evenScores,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const ODD_3341 = { startYear: 3341, term: "odd" } as const;
/** A day of that Ganjil, which gives the character grades. */
const TODAY = "3341-10-01";
const BEFORE = new Date("3341-09-01T03:00:00Z");
const LATER = new Date("3341-10-01T03:00:00Z");

/**
 * Five students who went from 70 to 80 on every value, one with a single
 * 90, one not assessed, all Aktif; and one on Cuti, who never counts.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Capaian Dashboard");
  const periodId = await addTestPeriod(db, 3341);
  const enteredBy = await addTestAccount(db, "Penilai Uji Capaian Dashboard");
  const add = (nim: string, more: Partial<typeof students.$inferInsert>) =>
    addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji Capaian ${nim}`,
      cohortYear: 3341,
      province: "Jawa Barat",
      ...more,
    });
  const assess = (studentId: string, score: number, enteredAt: Date) =>
    addTestAssessment(db, {
      studentId,
      periodId,
      enteredBy,
      enteredAt,
      scores: evenScores(score),
    });
  for (const nim of ["01", "02", "03", "04", "05"]) {
    const studentId = await add(`99865100${nim}`, {});
    await assess(studentId, 70, BEFORE);
    await assess(studentId, 80, LATER);
  }
  await assess(await add("9986510006", { province: "Bali" }), 90, LATER);
  await add("9986510007", { province: "Bali" });
  await assess(await add("9986510008", { status: "on_leave" }), 40, LATER);
  return {
    visible: eq(students.studyProgramId, programId),
    picksProgram: true,
    illnesses: null,
  };
}

describe("Capaian karakter of Dashboard pembangunan karakter", () => {
  it("averages the latest scores of the assessed Aktif students, with their change since the assessment before", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const { achievement } = await loadDashboard(
        db,
        scope,
        NO_FILTERS,
        ODD_3341,
        TODAY,
      );
      const recap = achievement.recap;

      expect(recap).toMatchObject({
        students: 7,
        assessed: 6,
        rerata: 81.7,
        spread: { gold: 1, silver: 5, bronze: 0, guidance: 0 },
      });
      expect(recap?.averages.M).toBeCloseTo(81.67, 2);
      expect(recap?.change?.changes.M).toBe(10);
      expect(recap?.change?.last.I).toBeCloseTo(71.67, 2);
    });
  });

  it("shows a cohort under 20 assessed students only with a filter", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const all = await loadDashboard(db, scope, NO_FILTERS, ODD_3341, TODAY);
      const regular = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, entryPath: "regular" },
        ODD_3341,
        TODAY,
      );

      expect(all.achievement.cohorts).toEqual([]);
      expect(
        regular.achievement.cohorts.map((row) => [
          row.cohortYear,
          row.entryPath,
          row.recap.assessed,
        ]),
      ).toEqual([[3341, "regular", 6]]);
    });
  });

  it("gives out no number of scores for a group with fewer than 5 assessed students", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const bali = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, province: "Bali" },
        ODD_3341,
        TODAY,
      );

      expect(bali.counts.matching).toBe(2);
      expect(bali.achievement).toEqual({ recap: null, cohorts: [] });
    });
  });
});
