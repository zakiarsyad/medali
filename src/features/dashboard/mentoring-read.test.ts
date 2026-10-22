// Sample Tahun akademik of this file: 5160 to 5161.
// Sample NIMs of this file: 9989620000 to 9989620099.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  addCoachingStatus,
  INTENSIVE,
  LIGHT,
  MODERATE,
  NOT_LISTED,
} from "@/features/guidance/test-coaching";
import {
  addTestAccount,
  addTestGroup,
  addTestNote,
  addTestProgram,
  addTestStudent,
} from "@/features/mentoring/test-records";
import { NO_FILTERS } from "./dashboard-address";
import { type DashboardScope, dashboardScopeOf } from "./dashboard-scope";
import { loadDashboard } from "./dashboard-view";

const inTestDatabase = withTestDatabase();

const ODD_5160 = { startYear: 5160, term: "odd" } as const;
const TODAY = "5160-10-31";
const ASSESSED_AT = new Date("5160-09-15T03:00:00Z");

function scopeOf(programId: number): DashboardScope {
  const visible = eq(students.studyProgramId, programId);
  return {
    visible,
    picksProgram: true,
    illnesses: null,
    shared: null,
    notes: visible,
  };
}

/**
 * Two groups of one program, each with its own mentor: four Aktif
 * students and one on Cuti in the first, two Aktif in the second, one
 * Aktif student in no group. The Bali students are 03, 06 and 07.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Pendampingan");
  const writer = await addTestAccount(db, "Pengasuh Uji Pendampingan", [
    "mentor",
  ]);
  const otherMentor = await addTestAccount(
    db,
    "Pengasuh Uji Pendampingan Lain",
    ["mentor"],
  );
  const add = (nim: string, more: Partial<typeof students.$inferInsert> = {}) =>
    addTestStudent(db, programId, {
      nim: `99896200${nim}`,
      name: `Mahasiswa Uji Pendampingan ${nim}`,
      province: "Jawa Barat",
      ...more,
    });
  const ids = {
    s01: await add("01"),
    s02: await add("02"),
    s03: await add("03", { province: "Bali" }),
    s04: await add("04"),
    s05: await add("05", { status: "on_leave" }),
    s06: await add("06", { province: "Bali" }),
    s07: await add("07", { province: "Bali" }),
    s08: await add("08"),
  };
  await addTestGroup(db, programId, {
    number: 1,
    memberIds: [ids.s01, ids.s02, ids.s03, ids.s04, ids.s05],
    mentorId: writer.id,
  });
  await addTestGroup(db, programId, {
    number: 2,
    memberIds: [ids.s06, ids.s07],
    mentorId: otherMentor.id,
  });
  return { programId, writer: writer.id, ids };
}

type TestIds = Awaited<ReturnType<typeof addRecords>>["ids"];

/** Intensif 01, 03, 05 and 07, of whom 07 is Selesai; Sedang 02; Ringan 04; 06 not listed. */
async function addCoaching(db: Database, byId: string, ids: TestIds) {
  const periodId = await addCoachingPeriod(db, 5160);
  const assess = (studentId: string, scores: Scores) =>
    addCoachingAssessment(db, studentId, byId, periodId, scores, ASSESSED_AT);
  await assess(ids.s01, INTENSIVE);
  await assess(ids.s02, MODERATE);
  await assess(ids.s03, INTENSIVE);
  await assess(ids.s04, LIGHT);
  await assess(ids.s05, INTENSIVE);
  await assess(ids.s06, NOT_LISTED);
  await assess(ids.s07, INTENSIVE);
  await addCoachingStatus(db, ids.s07, byId, "done");
}

describe("the numbers of Pendampingan on the Dashboard", () => {
  it("counts the mentors, the groups, the notes of the last 30 days and the students who need coaching", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addCoaching(db, writer, ids);
      await addTestNote(db, ids.s01, writer, { happenedOn: "5160-10-31" });
      await addTestNote(db, ids.s06, writer, { happenedOn: "5160-10-02" });
      await addTestNote(db, ids.s08, writer, { happenedOn: "5160-10-01" });
      await addTestNote(db, ids.s05, writer, { happenedOn: "5160-10-20" });

      const view = await loadDashboard(
        db,
        scopeOf(programId),
        NO_FILTERS,
        ODD_5160,
        TODAY,
      );

      expect(view.counts.matching).toBe(7);
      expect(view.mentoring.numbers).toEqual({
        everyone: null,
        mentors: 2,
        groups: 2,
        recentNotes: 2,
        openCoaching: 4,
        intensiveCoaching: 2,
      });
    });
  });

  it("counts only the students of the filter, with how many Aktif students there are without it", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addCoaching(db, writer, ids);
      await addTestNote(db, ids.s01, writer, { happenedOn: "5160-10-30" });
      await addTestNote(db, ids.s03, writer, { happenedOn: "5160-10-30" });

      const view = await loadDashboard(
        db,
        scopeOf(programId),
        { ...NO_FILTERS, province: "Bali" },
        ODD_5160,
        TODAY,
      );

      expect(view.counts.matching).toBe(3);
      expect(view.mentoring.numbers).toEqual({
        everyone: 7,
        mentors: 2,
        groups: 2,
        recentNotes: 1,
        openCoaching: 1,
        intensiveCoaching: 1,
      });
    });
  });

  it("counts no notes for an account that may read none", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addTestNote(db, ids.s01, writer, { happenedOn: "5160-10-30" });

      const view = await loadDashboard(
        db,
        { ...scopeOf(programId), notes: null },
        NO_FILTERS,
        ODD_5160,
        TODAY,
      );

      expect(view.mentoring.numbers.recentNotes).toBe(0);
    });
  });

  it("gives Ketua Program Studi only their own program, also when they ask for another one by hand", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      const otherProgramId = await addTestProgram(db, "Prodi Uji Lain");
      const other = await addTestStudent(db, otherProgramId, {
        nim: "9989620050",
        name: "Mahasiswa Uji Pendampingan Lain",
      });
      await addTestNote(db, other, writer, { happenedOn: "5160-10-30" });
      await addTestNote(db, ids.s01, writer, { happenedOn: "5160-10-30" });
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
        ODD_5160,
        TODAY,
      );

      expect(view.filters.studyProgramId).toBeNull();
      expect(view.mentoring.numbers.recentNotes).toBe(1);
      expect(view.mentoring.numbers.groups).toBe(2);
    });
  });
});

describe("Capaian MEDALI per program studi on the Dashboard", () => {
  /** A second program with four assessed Aktif students. */
  async function addSmallProgram(db: Database, byId: string) {
    const programId = await addTestProgram(db, "Prodi Uji Pendampingan Kecil");
    const periodId = await addCoachingPeriod(db, 5161);
    for (const nim of ["21", "22", "23", "24"]) {
      const studentId = await addTestStudent(db, programId, {
        nim: `99896200${nim}`,
        name: `Mahasiswa Uji Pendampingan ${nim}`,
      });
      await addCoachingAssessment(
        db,
        studentId,
        byId,
        periodId,
        NOT_LISTED,
        ASSESSED_AT,
      );
    }
    return programId;
  }

  function scopeOfBoth(programIds: number[]): DashboardScope {
    return {
      ...scopeOf(programIds[0] ?? 0),
      visible: inArray(students.studyProgramId, programIds),
    };
  }

  it("averages each program's assessed Aktif students, and sends no average for one with fewer than 5", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addCoaching(db, writer, ids);
      const smallId = await addSmallProgram(db, writer);

      const view = await loadDashboard(
        db,
        scopeOfBoth([programId, smallId]),
        NO_FILTERS,
        ODD_5160,
        TODAY,
      );

      expect(view.mentoring.programs).toEqual([
        {
          programId,
          name: "Prodi Uji Pendampingan",
          students: 7,
          average: 62.3,
        },
        {
          programId: smallId,
          name: "Prodi Uji Pendampingan Kecil",
          students: 4,
          average: null,
        },
      ]);
    });
  });

  it("averages only the students of the filter", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addCoaching(db, writer, ids);

      const view = await loadDashboard(
        db,
        scopeOf(programId),
        { ...NO_FILTERS, province: "Bali" },
        ODD_5160,
        TODAY,
      );

      expect(view.mentoring.programs).toEqual([
        {
          programId,
          name: "Prodi Uji Pendampingan",
          students: 3,
          average: null,
        },
      ]);
    });
  });

  it("reads no program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const { programId, writer, ids } = await addRecords(db);
      await addCoaching(db, writer, ids);
      const scope = dashboardScopeOf({
        id: crypto.randomUUID(),
        roles: ["head_of_program"],
        studyProgramId: programId,
        studentId: null,
      });
      if (scope === null) throw new Error("Ketua Program Studi was refused.");

      const view = await loadDashboard(db, scope, NO_FILTERS, ODD_5160, TODAY);

      expect(view.mentoring.programs).toBeNull();
    });
  });
});
