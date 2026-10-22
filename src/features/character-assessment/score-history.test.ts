// Sample Tahun akademik of this file: 4510 to 4512.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readStudentScoreHistory } from "./score-history";
import {
  addTestActor,
  addTestAssessment,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
  SILVER_SCORES,
} from "./test-assessments";

// Sample NIMs of this file: 9989500000 to 9989500099.

const inTestDatabase = withTestDatabase();

const LOW_SCORES = { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 };
const GOLD_SCORES = { M: 90, E: 88, D: 86, A: 85, L: 92, I: 89 };
const NEW_SCORES = { M: 70, E: 72, D: 74, A: 76, L: 78, I: 66 };

/**
 * Ani and Budi, angkatan 4510, of one program, Ani a mentee of the
 * Pengasuh; Citra, assessed once, of another program. Ani is assessed in Ganjil 4510 twice, the latest silver, and
 * in Ganjil 4511 once, gold, but not in Genap 4510; Budi is never
 * assessed. The newer period is added first, so the order of the points
 * cannot come from the order the rows were added in.
 */
async function addRecords(db: Database) {
  const third = await addTestPeriod(db, 4511);
  const first = await addTestPeriod(db, 4510);
  await addTestPeriod(db, 4510, "even");
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Riwayat Semester",
    4510,
    ["9989500001", "9989500002"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("Students missing.");
  const otherId = await addTestProgram(db, "Prodi Uji Riwayat Lain");
  const citra = await addTestStudent(db, otherId, {
    nim: "9989500003",
    name: "Mahasiswa Uji Riwayat Lain",
    cohortYear: 4510,
  });
  const penilai = await addTestActor(db, "Penilai Uji Riwayat", ["assessor"]);
  const mentor = await addTestActor(db, "Pengasuh Uji Riwayat", ["mentor"]);
  await addTestGroup(db, { programId, year: 4510 }, mentor.id, [ani]);
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId: third,
    enteredAt: new Date("4511-09-01T03:00:00Z"),
    scores: GOLD_SCORES,
  });
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId: first,
    enteredAt: new Date("4510-10-01T03:00:00Z"),
    scores: SILVER_SCORES,
  });
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId: first,
    enteredAt: new Date("4510-09-01T03:00:00Z"),
    scores: LOW_SCORES,
  });
  await addTestAssessment(db, penilai, {
    studentId: citra,
    periodId: first,
    enteredAt: new Date("4510-09-01T03:00:00Z"),
  });
  const actor = (name: string, roles: RoleId[]) =>
    addTestActor(db, name, roles, { studyProgramId: programId });
  return { ani, budi, citra, first, penilai, mentor, actor };
}

const ANI_POINTS = [
  {
    semester: 1,
    periodTitle: "Ganjil 4510/4511",
    scores: SILVER_SCORES,
    rerata: 80.3,
  },
  {
    semester: 3,
    periodTitle: "Ganjil 4511/4512",
    scores: GOLD_SCORES,
    rerata: 88.3,
  },
];

describe("readStudentScoreHistory", () => {
  it("gives one point per assessed period, the latest assessment of each, oldest first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, actor } = await addRecords(db);
      const kepala = await actor("Kepala Uji Riwayat", ["head_of_unit"]);

      expect(await readStudentScoreHistory(db, kepala, ani)).toEqual(
        ANI_POINTS,
      );
    });
  });

  it("gives it to every role that sees Capaian karakter, within its rows", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai, mentor, actor } = await addRecords(db);
      const direktur = await actor("Direktur Uji Riwayat", ["director"]);
      const kaprodi = await actor("Kaprodi Uji Riwayat", ["head_of_program"]);

      for (const account of [direktur, kaprodi, mentor, penilai]) {
        expect(await readStudentScoreHistory(db, account, ani)).toEqual(
          ANI_POINTS,
        );
      }
    });
  });

  it("gives an empty history for a student never assessed", async () => {
    await inTestDatabase(async (db) => {
      const { budi, penilai } = await addRecords(db);

      expect(await readStudentScoreHistory(db, penilai, budi)).toEqual([]);
    });
  });

  it("shows an assessment added later in a period in place of the one before", async () => {
    await inTestDatabase(async (db) => {
      const { ani, first, penilai } = await addRecords(db);
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId: first,
        enteredAt: new Date("4510-11-01T03:00:00Z"),
        scores: NEW_SCORES,
      });

      const points = await readStudentScoreHistory(db, penilai, ani);

      expect(points?.map((point) => point.scores)).toEqual([
        NEW_SCORES,
        GOLD_SCORES,
      ]);
    });
  });

  it("reads a student assessed many times in each semester well within a second", async () => {
    await inTestDatabase(async (db) => {
      const { budi, penilai } = await addRecords(db);
      const periodIds = [
        await addTestPeriod(db, 4511, "even"),
        await addTestPeriod(db, 4512),
      ];
      for (const [place, periodId] of periodIds.entries()) {
        for (let day = 1; day <= 25; day += 1) {
          await addTestAssessment(db, penilai, {
            studentId: budi,
            periodId,
            enteredAt: new Date(Date.UTC(4511 + place, 8, day, 3)),
          });
        }
      }
      const started = performance.now();

      const points = await readStudentScoreHistory(db, penilai, budi);

      expect(performance.now() - started).toBeLessThan(1000);
      expect(points?.map((point) => point.semester)).toEqual([4, 5]);
    });
  });

  it("refuses a role without the character panels, the same whether or not the student was assessed", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, actor } = await addRecords(db);
      const konselor = await actor("Konselor Uji Riwayat", ["counsellor"]);
      const pegawai = await actor("Pegawai Uji Riwayat", ["upk_staff"]);

      for (const account of [konselor, pegawai]) {
        expect(await readStudentScoreHistory(db, account, ani)).toBeNull();
        expect(await readStudentScoreHistory(db, account, budi)).toBeNull();
      }
    });
  });

  it("refuses a student outside the program of Ketua Program Studi or the mentees of Pengasuh, assessed or not", async () => {
    await inTestDatabase(async (db) => {
      const { budi, citra, mentor, actor } = await addRecords(db);
      const kaprodi = await actor("Kaprodi Uji Riwayat", ["head_of_program"]);

      expect(await readStudentScoreHistory(db, kaprodi, citra)).toBeNull();
      expect(await readStudentScoreHistory(db, mentor, citra)).toBeNull();
      expect(await readStudentScoreHistory(db, mentor, budi)).toBeNull();
      expect(await readStudentScoreHistory(db, kaprodi, budi)).toEqual([]);
    });
  });

  it("refuses an id of nobody and a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(
        await readStudentScoreHistory(db, penilai, crypto.randomUUID()),
      ).toBeNull();
      expect(
        await readStudentScoreHistory(db, penilai, "9989500001"),
      ).toBeNull();
    });
  });
});
