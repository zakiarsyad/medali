// Sample Tahun akademik of this file: 5190 to 5191.
// Sample NIMs of this file: 9989650000 to 9989650099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { counsellingSharingReads } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPenaltyOf } from "@/discipline-penalties/test-penalties";
import { addTestScreening } from "@/features/counselling/test-screenings";
import {
  addCoachingAssessment,
  addCoachingStatus,
  INTENSIVE,
} from "@/features/guidance/test-coaching";
import {
  addTestAccount,
  addTestGroup,
  addTestNote,
  addTestProgram,
  addTestStudent,
} from "@/features/mentoring/test-records";
import { menteeScopeOf } from "./mentee-scope";
import { loadMenteeDashboard } from "./mentee-view";
import {
  addTestFitnessScores,
  addTestPeriod,
  addTestPublishedLevel,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "5190-10-31";
const ASSESSED_AT = new Date("5190-09-15T03:00:00Z");

/**
 * Seven anak asuh of `mentor`, each with one reason or none: 01 Intensif
 * on the coaching list, 02 Intensif but Selesai, 03 under a Ringan
 * penalty, 04 tested Perlu perhatian, 05 Sedang published to Pengasuh,
 * 06 Sedang published to Kepala Unit only, 07 with nothing. 08 is the
 * student of another Pengasuh, with every reason.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Perlu Perhatian");
  const mentor = await addTestAccount(db, "Pengasuh Uji Perhatian", ["mentor"]);
  const other = await addTestAccount(db, "Pengasuh Uji Perhatian Lain", [
    "mentor",
  ]);
  const add = (nim: string) =>
    addTestStudent(db, programId, {
      nim: `99896500${nim}`,
      name: `Mahasiswa Uji Perhatian ${nim}`,
    });
  const ids = {
    s01: await add("01"),
    s02: await add("02"),
    s03: await add("03"),
    s04: await add("04"),
    s05: await add("05"),
    s06: await add("06"),
    s07: await add("07"),
    s08: await add("08"),
  };
  const { s08, ...own } = ids;
  await addTestGroup(db, programId, {
    number: 1,
    memberIds: Object.values(own),
    mentorId: mentor.id,
  });
  await addTestGroup(db, programId, {
    number: 2,
    memberIds: [s08],
    mentorId: other.id,
  });
  const periodId = await addTestPeriod(db, 5190);
  for (const studentId of [ids.s01, ids.s02, s08]) {
    await addCoachingAssessment(
      db,
      studentId,
      mentor.id,
      periodId,
      INTENSIVE,
      ASSESSED_AT,
    );
  }
  await addCoachingStatus(db, ids.s02, mentor.id, "done");
  for (const studentId of [ids.s03, s08]) {
    await addTestPenaltyOf(db, studentId, mentor.id, {
      category: "light",
      level: 1,
    });
  }
  await addTestFitnessScores(db, mentor.id, [
    { studentId: ids.s04, score: 60 },
    { studentId: ids.s07, score: 90 },
    { studentId: s08, score: 60 },
  ]);
  for (const studentId of [ids.s05, ids.s06, s08]) {
    await addTestScreening(db, studentId, mentor.id, { level: "moderate" });
  }
  await addTestPublishedLevel(db, ids.s05, mentor.id, ["mentor"]);
  await addTestPublishedLevel(db, ids.s06, mentor.id, ["head_of_unit"]);
  await addTestPublishedLevel(db, s08, mentor.id, ["mentor"]);
  return { mentor, ids };
}

describe("Perlu perhatian of Dashboard anak asuh", () => {
  it("names each anak asuh with a reason, one tag per reason, and no student of another Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      const scope = menteeScopeOf(mentor);
      if (scope === null) throw new Error("No scope.");

      const view = await loadMenteeDashboard(db, scope, null, TODAY);
      if (view.kind !== "shown") throw new Error("No group.");
      const tags = new Map(
        view.attention.map((row) => [
          row.studentId,
          row.reasons.map((reason) => reason.words),
        ]),
      );

      expect(tags).toEqual(
        new Map([
          [ids.s01, ["Capaian: pembinaan intensif"]],
          [ids.s03, ["Hukuman disiplin ringan"]],
          [ids.s04, ["Jasmani: perlu perhatian"]],
          [ids.s05, ["Mental: sedang"]],
        ]),
      );
      expect(view.attention[0]).toMatchObject({
        studentId: ids.s01,
        rerata: 58.3,
        opensDetail: true,
      });
    });
  });

  it("logs the reading of each level it shows, and of no other", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      const scope = menteeScopeOf(mentor);
      if (scope === null) throw new Error("No scope.");

      await loadMenteeDashboard(db, scope, null, TODAY);
      const readings = await db
        .select({ studentId: counsellingSharingReads.studentId })
        .from(counsellingSharingReads)
        .where(eq(counsellingSharingReads.readBy, mentor.id));

      expect(readings).toEqual([{ studentId: ids.s05 }]);
    });
  });

  it("gives the latest notes about the anak asuh, at most 5, with the numbers under them", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);
      const note = (studentId: string, day: string, hour: number) =>
        addTestNote(db, studentId, mentor.id, {
          happenedOn: day,
          writtenAt: new Date(`${day}T0${hour}:00:00Z`),
        });
      await note(ids.s07, "5190-09-01", 9);
      for (const day of ["01", "02", "03", "04", "05", "06"]) {
        await note(ids.s01, `5190-10-${day}`, 3);
      }
      await note(ids.s08, "5190-10-30", 3);
      const scope = menteeScopeOf(mentor);
      if (scope === null) throw new Error("No scope.");

      const view = await loadMenteeDashboard(db, scope, null, TODAY);
      if (view.kind !== "shown") throw new Error("No group.");

      expect(view.notes).toHaveLength(5);
      expect(view.notes.every((note) => note.studentId === ids.s01)).toBe(true);
      expect(view.noteNumbers).toEqual({
        recentNotes: 5,
        openCoaching: 1,
        penalties: 1,
        attendance: null,
      });
    });
  });
});
