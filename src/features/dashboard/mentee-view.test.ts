// Sample Tahun akademik of this file: 5170 to 5171.
// Sample NIMs of this file: 9989630000 to 9989630099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, type students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPeriod } from "@/features/mentoring/test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
} from "@/features/mentoring/test-records";
import { addTestScore } from "@/features/mentoring/test-scores";
import { readStudentDetail } from "@/features/students/student-detail";
import type { Illness } from "@/health-notes/health-ids";
import { addTestNote } from "@/health-notes/test-health";
import { addTestMeeting } from "@/mentoring/test-meetings";
import type { MenteeDashboard } from "./mentee-recap";
import { menteeAccountOf, menteeScopeOf } from "./mentee-scope";
import { loadMenteeDashboard } from "./mentee-view";
import { addTestFitnessScores } from "./test-records";

const inTestDatabase = withTestDatabase();

const ODD_5170 = { startYear: 5170, term: "odd" } as const;
const TODAY = "5170-10-31";

/**
 * Two groups of one program: the first held by `mentor`, with three
 * Aktif students and one on Cuti, the second by `other`, with two Aktif
 * students. `spare` holds no group.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Anak Asuh");
  const mentor = await addTestAccount(db, "Pengasuh Uji Anak Asuh", ["mentor"]);
  const other = await addTestAccount(db, "Pengasuh Uji Anak Asuh Lain", [
    "mentor",
  ]);
  const spare = await addTestAccount(db, "Pengasuh Uji Tanpa Kelompok", [
    "mentor",
  ]);
  const add = (nim: string, more: Partial<typeof students.$inferInsert> = {}) =>
    addTestStudent(db, programId, {
      nim: `99896300${nim}`,
      name: `Mahasiswa Uji Anak Asuh ${nim}`,
      ...more,
    });
  const ids = {
    s01: await add("01"),
    s02: await add("02"),
    s03: await add("03"),
    s04: await add("04", { status: "on_leave" }),
    s05: await add("05"),
    s06: await add("06"),
  };
  const groupId = await addTestGroup(db, programId, {
    number: 1,
    memberIds: [ids.s01, ids.s02, ids.s03, ids.s04],
    mentorId: mentor.id,
  });
  const otherGroupId = await addTestGroup(db, programId, {
    number: 2,
    memberIds: [ids.s05, ids.s06],
    mentorId: other.id,
  });
  const { day: _day, ...days } = await addTestPeriod(db, 5170);
  const period: AcademicPeriod = { ...ODD_5170, ...days };
  return { mentor, other, spare, ids, groupId, otherGroupId, period };
}

/** A second group of `mentor`, with one Aktif student of its own. */
async function addSecondGroup(db: Database, mentor: AccountForAccess) {
  const programId = await addTestProgram(db, "Prodi Uji Anak Asuh Kedua");
  const s07 = await addTestStudent(db, programId, {
    nim: "9989630007",
    name: "Mahasiswa Uji Anak Asuh 07",
  });
  const groupId = await addTestGroup(db, programId, {
    number: 1,
    memberIds: [s07],
    mentorId: mentor.id,
  });
  return groupId;
}

async function load(
  db: Database,
  account: AccountForAccess,
  period: AcademicPeriod | null = null,
): Promise<MenteeDashboard> {
  const scope = menteeScopeOf(account);
  if (scope === null)
    throw new Error("The account has no Dashboard anak asuh.");
  return loadMenteeDashboard(db, scope, period, TODAY);
}

function shown(view: MenteeDashboard) {
  if (view.kind !== "shown") throw new Error("Dashboard anak asuh is empty.");
  return view;
}

describe("Dashboard anak asuh", () => {
  it("counts the Aktif anak asuh of the mentor's own group only", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);

      const view = shown(await load(db, mentor));

      expect(view.students).toBe(3);
      expect(view.groups.map((group) => group.number)).toEqual([1]);
    });
  });

  it("shows nothing but the message to a Pengasuh without a group", async () => {
    await inTestDatabase(async (db) => {
      const { spare } = await addRecords(db);

      expect(await load(db, spare)).toEqual({ kind: "no_group" });
    });
  });

  it("keeps a person who is also Kepala Unit to their own anak asuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);
      const both: AccountForAccess = {
        ...mentor,
        roles: ["mentor", "head_of_unit"],
      };

      const view = shown(await load(db, both));

      expect(view.students).toBe(3);
    });
  });

  it("leaves out on the next load a student who left the group, and a group handed to another Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, other, ids, groupId } = await addRecords(db);
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, ids.s01));

      expect(shown(await load(db, mentor)).students).toBe(2);

      await replaceTestMentor(db, groupId, other.id, "5170-10-01");

      expect(await load(db, mentor)).toEqual({ kind: "no_group" });
      expect(shown(await load(db, other)).students).toBe(4);
    });
  });

  it("counts the meetings filled in of the group with the fewest, and the Aktif anak asuh scored, in the running period only", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, other, ids, otherGroupId, period } = await addRecords(db);
      const secondId = await addSecondGroup(db, mentor);
      const lastYear = await addTestPeriod(db, 5171);
      const meet = (groupId: string, number: number, periodId = period.id) =>
        addTestMeeting(db, { groupId, periodId, number, savedBy: mentor.id });
      await meet(secondId, 1);
      await meet(secondId, 2);
      await meet(secondId, 3, lastYear.id);
      await meet(otherGroupId, 1);
      const score = (studentId: string, periodId = period.id) =>
        addTestScore(db, {
          studentId,
          periodId,
          score: 80,
          scoredBy: mentor.id,
        });
      await score(ids.s01);
      await score(ids.s04);
      await score(ids.s02, lastYear.id);
      await score(ids.s05);

      const view = shown(await load(db, mentor, period));

      expect(view.progress).toEqual({
        period: ODD_5170,
        filled: 0,
        meetings: 4,
        scored: 1,
        students: 4,
      });
      expect(shown(await load(db, other, period)).progress?.filled).toBe(1);
    });
  });

  it("names the illnesses of the two lower categories of even 1 or 2 anak asuh, and none of another Pengasuh's", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      await addTestFitnessScores(db, mentor.id, [
        { studentId: ids.s01, score: 40 },
        { studentId: ids.s02, score: 40 },
        { studentId: ids.s05, score: 40 },
      ]);
      const note = (studentId: string, illnesses: Illness[]) =>
        addTestNote(db, mentor, {
          studentId,
          savedAt: new Date("2026-10-12T03:00:00Z"),
          illnesses: illnesses.map((illness) => ({ illness, note: "" })),
        });
      await note(ids.s01, ["asthma", "hypertension"]);
      await note(ids.s02, ["hypertension"]);
      await note(ids.s05, ["epilepsy"]);

      const { physical } = shown(await load(db, mentor)).cards;

      expect(physical).toMatchObject({
        kind: "shown",
        tested: 2,
        illnesses: [
          { illness: "hypertension", students: 2 },
          { illness: "asthma", students: 1 },
        ],
      });
    });
  });

  it("counts no progress while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);

      expect(shown(await load(db, mentor)).progress).toBeNull();
    });
  });

  it("refuses a person who is also Kepala Unit, on this view, the detail of a student who is not their anak asuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      const both: AccountForAccess = {
        ...mentor,
        roles: ["head_of_unit", "mentor"],
      };
      const viewer = menteeAccountOf(both);

      const own = await readStudentDetail(db, viewer, ids.s01, ODD_5170);
      const notOwn = await readStudentDetail(db, viewer, ids.s05, ODD_5170);

      expect(own.kind).toBe("found");
      expect(notOwn.kind).toBe("not_found");
      expect((await readStudentDetail(db, both, ids.s05, ODD_5170)).kind).toBe(
        "found",
      );
    });
  });

  it("refuses a Pengasuh the detail of a student who is not their anak asuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);

      const own = await readStudentDetail(db, mentor, ids.s01, ODD_5170);
      const notOwn = await readStudentDetail(db, mentor, ids.s05, ODD_5170);

      expect(own.kind).toBe("found");
      expect(notOwn.kind).toBe("not_found");
    });
  });
});
