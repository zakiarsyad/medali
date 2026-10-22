// Sample Tahun akademik of this file: 3330 to 3331.
// Sample NIMs of this file: 9986500000 to 9986500099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { NO_AGENCY, NO_FILTERS } from "./dashboard-address";
import { dashboardScopeOf } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";

const inTestDatabase = withTestDatabase();

/** Angkatan 3331 is in semester 1, tahap 1; angkatan 3330 in semester 3, tahap 2. */
const ODD_3331 = { startYear: 3331, term: "odd" } as const;
/** A day of that Ganjil, which gives the character grades. */
const TODAY = "3331-10-01";
const AGENCY = "Instansi Uji Dashboard";

async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Dashboard");
  const otherProgramId = await addTestProgram(db, "Prodi Uji Dashboard Lain");
  const add = (nim: string, more: Partial<typeof students.$inferInsert>) =>
    addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji Dashboard ${nim}`,
      cohortYear: 3331,
      ...more,
    });
  await add("9986500001", { province: "Jawa Barat", isAffirmation: true });
  await add("9986500002", {
    province: "Jawa Barat",
    entryPath: "transfer",
    originAgency: AGENCY,
  });
  await add("9986500003", {
    province: "Bali",
    cohortYear: 3330,
    isSeedling: true,
  });
  await add("9986500004", {
    province: "Bali",
    cohortYear: 3330,
    status: "on_leave",
  });
  await addTestStudent(db, otherProgramId, {
    nim: "9986500005",
    name: "Mahasiswa Uji Dashboard Lain",
    cohortYear: 3331,
    province: "Jawa Barat",
  });
  return { programId, otherProgramId };
}

describe("the filter of Dashboard pembangunan karakter", () => {
  it("counts the Aktif students under each choice, with every other filter applied and without its own", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const scope = {
        visible: eq(students.studyProgramId, programId),
        picksProgram: true,
        illnesses: null,
        shared: null,
      };

      const all = await loadDashboard(db, scope, NO_FILTERS, ODD_3331, TODAY);
      const regular = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, entryPath: "regular" },
        ODD_3331,
        TODAY,
      );

      expect(all.counts.matching).toBe(3);
      expect(all.counts.stages).toEqual(
        new Map([
          [1, 2],
          [2, 1],
        ]),
      );
      expect(all.counts.affirmation).toEqual(
        new Map([
          [true, 1],
          [false, 2],
        ]),
      );
      expect(all.counts.agencies).toEqual(
        new Map([
          [NO_AGENCY, 2],
          [AGENCY, 1],
        ]),
      );
      expect(all.held.provinces).toEqual(["Bali", "Jawa Barat"]);
      expect(regular.counts.matching).toBe(2);
      expect(regular.counts.entryPaths).toEqual(
        new Map([
          ["regular", 2],
          ["transfer", 1],
        ]),
      );
      expect(regular.counts.provinces).toEqual(
        new Map([
          ["Bali", 1],
          ["Jawa Barat", 1],
        ]),
      );
    });
  });

  it("takes a provinsi none of the students holds as not chosen, and offers no tahap while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const scope = {
        visible: eq(students.studyProgramId, programId),
        picksProgram: true,
        illnesses: null,
        shared: null,
      };

      const view = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, province: "Atlantis", stageNo: 1 },
        null,
        TODAY,
      );

      expect(view.filters).toEqual(NO_FILTERS);
      expect(view.stagesShown).toBe(false);
      expect(view.counts.matching).toBe(3);
    });
  });

  it("gives Ketua Program Studi only their own program, also when they ask for another one by hand", async () => {
    await inTestDatabase(async (db) => {
      const { programId, otherProgramId } = await addRecords(db);
      const scope = dashboardScopeOf({
        id: crypto.randomUUID(),
        roles: ["head_of_program"],
        studyProgramId: programId,
        studentId: null,
      });
      if (scope === null) throw new Error("Ketua Program Studi was refused.");

      const view = await loadDashboard(
        db,
        scope,
        { ...NO_FILTERS, studyProgramId: otherProgramId },
        ODD_3331,
        TODAY,
      );

      expect(view.programs).toBeNull();
      expect(view.filters.studyProgramId).toBeNull();
      expect(view.counts.matching).toBe(3);
      expect(view.counts.programs).toEqual(new Map([[programId, 3]]));
    });
  });
});
