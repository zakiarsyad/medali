// Sample Tahun akademik of this file: 3351 to 3351.
// Sample NIMs of this file: 9986520000 to 9986520099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addTestNote } from "@/health-notes/test-health";
import { NO_FILTERS } from "./dashboard-address";
import { loadDashboard } from "./dashboard-view";
import { addTestAccount, addTestFitnessScores } from "./test-records";

const inTestDatabase = withTestDatabase();

const ODD_3351 = { startYear: 3351, term: "odd" } as const;
const SAVED = new Date("2026-09-03T03:00:00Z");

/**
 * In one program: five Prima from Jawa Barat; from Bali one Prima whose
 * note says Perlu perhatian, one Perlu tindak lanjut medis by the test,
 * one untested whose note says Perlu tindak lanjut medis, and two
 * untested; one tested on Cuti, who never counts. In another program one
 * tested student the scope does not see.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Jasmani Dashboard");
  const otherId = await addTestProgram(db, "Prodi Uji Jasmani Dashboard Lain");
  const by = await addTestAccount(db, "Penilai Uji Jasmani Dashboard");
  let next = 0;
  const add = (more: Partial<typeof students.$inferInsert> = {}) => {
    next += 1;
    const nim = `99865200${String(next).padStart(2, "0")}`;
    return addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji Jasmani ${nim}`,
      cohortYear: 3351,
      province: "Bali",
      ...more,
    });
  };
  const scores: { studentId: string; score: number }[] = [];
  for (let place = 0; place < 5; place += 1) {
    scores.push({
      studentId: await add({ province: "Jawa Barat" }),
      score: 95,
    });
  }
  const noted = await add();
  scores.push({ studentId: noted, score: 95 });
  scores.push({ studentId: await add(), score: 40 });
  const untestedNoted = await add();
  await add();
  await add();
  scores.push({ studentId: await add({ status: "on_leave" }), score: 40 });
  const other = await addTestStudent(db, otherId, {
    nim: "9986520099",
    name: "Mahasiswa Uji Jasmani Lain",
    cohortYear: 3351,
  });
  scores.push({ studentId: other, score: 40 });
  await addTestFitnessScores(db, by, scores);
  const note = { savedAt: SAVED, illnesses: [] };
  await addTestNote(
    db,
    { id: by },
    {
      ...note,
      studentId: noted,
      category: "attention",
    },
  );
  await addTestNote(
    db,
    { id: by },
    {
      ...note,
      studentId: untestedNoted,
      category: "medical",
    },
  );
  return {
    visible: eq(students.studyProgramId, programId),
    picksProgram: true,
  };
}

/** Every number the value holds, however deep. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numbersIn);
}

describe("Kesehatan jasmani of Dashboard pembangunan karakter", () => {
  it("counts the final category of the Aktif students the account sees, with how many are tested", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_3351);

      expect(view.physical).toEqual({
        kind: "shown",
        students: 10,
        tested: 7,
        untested: "<5",
        byCategory: {
          excellent: 5,
          good: 0,
          attention: "<5",
          medical: "<5",
        },
        fitShare: 63,
      });
    });
  });

  it("sends no count of 1 to 4 to the browser", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_3351);
      const small = numbersIn(view.physical).filter(
        (each) => each >= 1 && each <= 4,
      );

      expect(small).toEqual([]);
    });
  });

  it("gives no count for a filtered group with fewer than 5 tested students", async () => {
    await inTestDatabase(async (db) => {
      const scope = await addRecords(db);

      const bali = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, province: "Bali" },
        ODD_3351,
      );

      expect(bali.counts.matching).toBe(5);
      expect(bali.physical).toEqual({ kind: "too_few", students: 5 });
    });
  });
});
