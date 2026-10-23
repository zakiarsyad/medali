// Sample Tahun akademik of this file: 5180 to 5181.
// Sample NIMs of this file: 9989640000 to 9989640099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestScreening } from "@/features/counselling/test-screenings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "@/features/mentoring/test-records";
import { menteeScopeOf } from "./mentee-scope";
import { loadMenteeDashboard } from "./mentee-view";
import {
  addTestAssessment,
  addTestFitnessScores,
  addTestPeriod,
  addTestPublishedLevel,
  evenScores,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "5180-10-31";

/**
 * A group of `mentor` with two Aktif anak asuh, and a student of another
 * Pengasuh. 01 is assessed Emas and tested Prima; 02 has Sedang
 * published to Pengasuh. The other student has all of it too.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Kartu Anak Asuh");
  const mentor = await addTestAccount(db, "Pengasuh Uji Kartu", ["mentor"]);
  const other = await addTestAccount(db, "Pengasuh Uji Kartu Lain", ["mentor"]);
  const add = (nim: string) =>
    addTestStudent(db, programId, {
      nim: `99896400${nim}`,
      name: `Mahasiswa Uji Kartu ${nim}`,
    });
  const s01 = await add("01");
  const s02 = await add("02");
  const s03 = await add("03");
  await addTestGroup(db, programId, {
    number: 1,
    memberIds: [s01, s02],
    mentorId: mentor.id,
  });
  await addTestGroup(db, programId, {
    number: 2,
    memberIds: [s03],
    mentorId: other.id,
  });
  const periodId = await addTestPeriod(db, 5180);
  const enteredAt = new Date("5180-09-15T03:00:00Z");
  for (const studentId of [s01, s03]) {
    await addTestAssessment(db, {
      studentId,
      periodId,
      enteredBy: mentor.id,
      enteredAt,
      scores: evenScores(90),
    });
  }
  await addTestFitnessScores(db, mentor.id, [
    { studentId: s01, score: 90 },
    { studentId: s03, score: 90 },
  ]);
  for (const studentId of [s02, s03]) {
    await addTestScreening(db, studentId, mentor.id, { level: "moderate" });
    await addTestPublishedLevel(db, studentId, mentor.id, ["mentor"]);
  }
  return { mentor };
}

describe("the four cards of Dashboard anak asuh", () => {
  it("count the anak asuh only, a single one among them, with no number held back", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);
      const scope = menteeScopeOf(mentor);
      if (scope === null) throw new Error("No scope.");

      const view = await loadMenteeDashboard(db, scope, null, TODAY);
      if (view.kind !== "shown") throw new Error("No group.");

      expect(view.cards.achievement).toMatchObject({
        students: 2,
        assessed: 1,
        rerata: 90,
      });
      expect(view.cards.physical).toMatchObject({
        kind: "shown",
        students: 2,
        tested: 1,
        untested: 1,
        byCategory: { excellent: 1, good: 0, attention: 0, medical: 0 },
        fitShare: 100,
      });
      expect(view.cards.published).toMatchObject({
        matching: 1,
        needCounselling: 1,
      });
      expect(view.cards.grades.recap.kind).toBe("none");
    });
  });
});
