// Sample Tahun akademik of this file: 4502 to 4502.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  addTestRecorder,
  TEST_DESCRIPTION,
} from "@/discipline-penalties/test-penalties";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readStudentAchievement } from "./student-achievement";
import {
  addTestActor,
  addTestAssessment,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
  SILVER_SCORES,
} from "./test-assessments";

// Sample NIMs of this file: 9989320000 to 9989320099.

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 4502/4503, which runs then. */
const TODAY = "4502-10-20";

const LOW_SCORES = { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 };

/**
 * Ani and Budi, angkatan 4501, of one program, Ani a mentee of the
 * Pengasuh; Citra of another program. Ani has two assessments, the
 * latest silver; Budi and Citra have none.
 */
async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 4502);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Capaian Detail",
    4501,
    ["9989320001", "9989320002"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("Students missing.");
  const otherId = await addTestProgram(db, "Prodi Uji Capaian Lain");
  const citra = await addTestStudent(db, otherId, {
    nim: "9989320003",
    name: "Mahasiswa Uji Capaian Lain",
    cohortYear: 4501,
  });
  const penilai = await addTestActor(db, "Penilai Uji Capaian", ["assessor"]);
  const mentor = await addTestActor(db, "Pengasuh Uji Capaian", ["mentor"]);
  await addTestGroup(db, { programId, year: 4501 }, mentor.id, [ani]);
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId,
    enteredAt: new Date("4502-09-01T03:00:00Z"),
    scores: LOW_SCORES,
  });
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId,
    enteredAt: new Date("4502-10-01T03:00:00Z"),
    scores: SILVER_SCORES,
    source: "medali_instrument",
  });
  const actor = (name: string, roles: RoleId[]) =>
    addTestActor(db, name, roles, { studyProgramId: programId });
  return { programId, ani, budi, citra, penilai, mentor, actor };
}

describe("readStudentAchievement", () => {
  it("gives the latest assessment, the one before it and the student's semester", async () => {
    await inTestDatabase(async (db) => {
      const { ani, actor } = await addRecords(db);
      const kepala = await actor("Kepala Uji Capaian", ["head_of_unit"]);

      const shown = await readStudentAchievement(db, kepala, ani, TODAY);

      expect(shown).toEqual({
        studentId: ani,
        semester: 3,
        latest: expect.objectContaining({
          source: "medali_instrument",
          enteredAt: new Date("4502-10-01T03:00:00Z"),
          scores: SILVER_SCORES,
        }),
        earlier: LOW_SCORES,
        mayAssess: true,
        limit: null,
      });
    });
  });

  it("gives the scores held at 70 of a student under a Ringan or Sedang penalty, with the Rerata as stored and the penalty's Kategori and Jenjang, never its Uraian", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai, actor } = await addRecords(db);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, ani, recorder, {
        category: "light",
        level: 3,
      });
      const kepala = await actor("Kepala Uji Capaian Batas", ["head_of_unit"]);

      for (const account of [kepala, penilai]) {
        const shown = await readStudentAchievement(db, account, ani, TODAY);

        expect(shown?.latest).toMatchObject({
          scores: { M: 70, E: 70, D: 70, A: 70, L: 70, I: 70 },
          storedRerata: 80.3,
        });
        expect(shown?.earlier).toEqual(LOW_SCORES);
        expect(shown?.limit).toEqual({ category: "light", level: 3 });
        expect(JSON.stringify(shown)).not.toContain(TEST_DESCRIPTION);
      }
    });
  });

  it("offers Input asesmen only to an account that may assess, and only for an Aktif student", async () => {
    await inTestDatabase(async (db) => {
      const { programId, budi, penilai, actor } = await addRecords(db);
      const direktur = await actor("Direktur Uji Capaian", ["director"]);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9989320004",
        name: "Mahasiswa Uji Capaian Cuti",
        cohortYear: 4501,
        status: "on_leave",
      });

      const forPenilai = await readStudentAchievement(db, penilai, budi, TODAY);
      const forDirektur = await readStudentAchievement(
        db,
        direktur,
        budi,
        TODAY,
      );
      const onLeaveShown = await readStudentAchievement(
        db,
        penilai,
        onLeave,
        TODAY,
      );

      expect(forPenilai).toMatchObject({ latest: null, mayAssess: true });
      expect(forDirektur).toMatchObject({ latest: null, mayAssess: false });
      expect(onLeaveShown).toMatchObject({ latest: null, mayAssess: false });
    });
  });

  it("refuses a role without the character panels, the same whether or not the student was assessed", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, actor } = await addRecords(db);
      const konselor = await actor("Konselor Uji Capaian", ["counsellor"]);
      const pegawai = await actor("Pegawai Uji Capaian", ["upk_staff"]);

      for (const account of [konselor, pegawai]) {
        expect(
          await readStudentAchievement(db, account, ani, TODAY),
        ).toBeNull();
        expect(
          await readStudentAchievement(db, account, budi, TODAY),
        ).toBeNull();
      }
    });
  });

  it("refuses a student outside the program of Ketua Program Studi or the mentees of Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, citra, mentor, actor } = await addRecords(db);
      const kaprodi = await actor("Kaprodi Uji Capaian", ["head_of_program"]);

      expect(
        await readStudentAchievement(db, kaprodi, ani, TODAY),
      ).not.toBeNull();
      expect(
        await readStudentAchievement(db, kaprodi, citra, TODAY),
      ).toBeNull();
      expect(
        await readStudentAchievement(db, mentor, ani, TODAY),
      ).not.toBeNull();
      expect(await readStudentAchievement(db, mentor, budi, TODAY)).toBeNull();
    });
  });

  it("refuses an id of nobody and a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(
        await readStudentAchievement(db, penilai, crypto.randomUUID(), TODAY),
      ).toBeNull();
      expect(
        await readStudentAchievement(db, penilai, "9989320001", TODAY),
      ).toBeNull();
    });
  });
});
