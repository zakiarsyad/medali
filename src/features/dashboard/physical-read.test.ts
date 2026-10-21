// Sample Tahun akademik of this file: 3351 to 3351.
// Sample NIMs of this file: 9986520000 to 9986520099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { Illness } from "@/health-notes/health-ids";
import { addTestNote, type TestNote } from "@/health-notes/test-health";
import { NO_FILTERS } from "./dashboard-address";
import { dashboardScopeOf } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";
import { addTestAccount, addTestFitnessScores } from "./test-records";

const inTestDatabase = withTestDatabase();

const ODD_3351 = { startYear: 3351, term: "odd" } as const;
const SAVED = new Date("2026-09-03T03:00:00Z");

/**
 * In one program: five Prima from Jawa Barat, one with Diabetes; from
 * Bali one Prima with Asma whose note says Perlu perhatian, one Perlu
 * tindak lanjut medis by the test with Asma and Hipertensi, one untested
 * with Asma and Lainnya whose note says Perlu tindak lanjut medis, and
 * two untested; one tested with Epilepsi on Cuti, who never counts. In
 * another program one tested student with Epilepsi the scope does not
 * see.
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
  const prima: string[] = [];
  for (let place = 0; place < 5; place += 1) {
    prima.push(await add({ province: "Jawa Barat" }));
  }
  for (const studentId of prima) scores.push({ studentId, score: 95 });
  const noted = await add();
  scores.push({ studentId: noted, score: 95 });
  const low = await add();
  scores.push({ studentId: low, score: 40 });
  const untestedNoted = await add();
  await add();
  await add();
  const away = await add({ status: "on_leave" });
  scores.push({ studentId: away, score: 40 });
  const other = await addTestStudent(db, otherId, {
    nim: "9986520099",
    name: "Mahasiswa Uji Jasmani Lain",
    cohortYear: 3351,
  });
  scores.push({ studentId: other, score: 40 });
  await addTestFitnessScores(db, by, scores);
  const ill = (...illnesses: Illness[]) =>
    illnesses.map((illness) => ({ illness, note: "" }));
  const note = (studentId: string, more: Partial<TestNote>) =>
    addTestNote(db, { id: by }, { savedAt: SAVED, studentId, ...more });
  await note(noted, { category: "attention", illnesses: ill("asthma") });
  await note(low, { illnesses: ill("asthma", "hypertension") });
  await note(untestedNoted, {
    category: "medical",
    illnesses: ill("asthma", "other"),
  });
  const [diabetic] = prima;
  if (diabetic === undefined) throw new Error("No student was added.");
  await note(diabetic, { illnesses: ill("diabetes") });
  await note(away, { illnesses: ill("epilepsy") });
  await note(other, { illnesses: ill("epilepsy") });
  return {
    programId,
    scope: {
      visible: eq(students.studyProgramId, programId),
      picksProgram: true,
      illnesses: null,
    },
  };
}

/** The Dashboard scope of an account of the roles, of the program given. */
function scopeOf(roles: RoleId[], programId: number) {
  const scope = dashboardScopeOf({
    id: crypto.randomUUID(),
    roles,
    studyProgramId: programId,
    studentId: null,
  });
  if (scope === null) throw new Error(`${roles.join(", ")} was refused.`);
  return scope;
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
      const { scope } = await addRecords(db);

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
        illnesses: null,
      });
    });
  });

  it("gives Kepala Unit the illnesses of the two lower categories, each as a count and no student, leaving out Lainnya", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);

      const view = await loadDashboard(
        db,
        scopeOf(["head_of_unit"], programId),
        { ...NO_FILTERS, studyProgramId: programId },
        ODD_3351,
      );

      expect(view.physical).toMatchObject({
        illnesses: [
          { illness: "asthma", students: "<5" },
          { illness: "hypertension", students: "<5" },
        ],
      });
    });
  });

  it("gives Direktur and Ketua Program Studi no illness, whatever they ask for", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const asked = { ...NO_FILTERS, studyProgramId: programId };

      for (const roles of [["director"], ["head_of_program"]] as const) {
        const view = await loadDashboard(
          db,
          scopeOf([...roles], programId),
          asked,
          ODD_3351,
        );

        expect(view.physical).toMatchObject({ kind: "shown", tested: 7 });
        expect(view.physical).toMatchObject({ illnesses: null });
        expect(JSON.stringify(view)).not.toMatch(/asthma|hypertension/);
      }
    });
  });

  it("sends no count of 1 to 4 to the browser", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);

      const view = await loadDashboard(
        db,
        scopeOf(["head_of_unit"], programId),
        { ...NO_FILTERS, studyProgramId: programId },
        ODD_3351,
      );
      const small = numbersIn(view.physical).filter(
        (each) => each >= 1 && each <= 4,
      );

      expect(view.physical).toMatchObject({ kind: "shown" });
      expect(small).toEqual([]);
    });
  });

  it("gives no count and no illness for a filtered group with fewer than 5 tested students", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);

      const bali = await loadDashboard(
        db,
        scopeOf(["head_of_unit"], programId),
        { ...NO_FILTERS, studyProgramId: programId, province: "Bali" },
        ODD_3351,
      );

      expect(bali.counts.matching).toBe(5);
      expect(bali.physical).toEqual({ kind: "too_few", students: 5 });
    });
  });
});
