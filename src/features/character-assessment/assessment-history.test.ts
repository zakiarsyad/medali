// Sample Tahun akademik of this file: 3270 to 3270.
// Sample NIMs of this file: 9986040000 to 9986040099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readAssessmentHistory } from "./assessment-history";
import { assessmentVisibleTo } from "./assessment-readers";
import {
  addTestActor,
  addTestAssessment,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

const inTestDatabase = withTestDatabase();

const ODD = new Date("3270-09-01T03:00:00Z");
const EVEN = new Date("3271-03-01T03:00:00Z");

async function addRecords(db: Database) {
  const odd = await addTestPeriod(db, 3270);
  const even = await addTestPeriod(db, 3270, "even");
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Riwayat Asesmen",
    3270,
    ["9986040001", "9986040002"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("Students missing.");
  const otherProgram = await addTestProgram(db, "Prodi Uji Riwayat Lain");
  const dina = await addTestStudent(db, otherProgram, {
    nim: "9986040011",
    name: "Mahasiswa Uji Riwayat Lain",
    cohortYear: 3270,
  });
  const penilai = await addTestActor(db, "Penilai Uji Riwayat", ["assessor"]);
  const first = await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId: odd,
    enteredAt: ODD,
    note: "Catatan pertama.",
  });
  const second = await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId: even,
    enteredAt: EVEN,
    source: "peer_assessment",
    note: "Catatan kedua.",
  });
  for (const studentId of [budi, dina]) {
    await addTestAssessment(db, penilai, {
      studentId,
      periodId: odd,
      enteredAt: ODD,
    });
  }
  return { programId, ani, budi, dina, penilai, first, second };
}

describe("readAssessmentHistory", () => {
  it("gives Penilai Mahasiswa every assessment of a student, newest first, with its period, who and Catatan penilai", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai, first, second } = await addRecords(db);

      const history = await readAssessmentHistory(
        db,
        assessmentVisibleTo(penilai),
        ani,
        true,
      );

      expect(history?.name).toBe("Mahasiswa Uji Asesmen 1");
      expect(
        history?.entries.map((entry) => [
          entry.id,
          entry.period,
          entry.source,
          entry.enteredBy,
          entry.note,
        ]),
      ).toEqual([
        [
          second,
          { startYear: 3270, term: "even" },
          "peer_assessment",
          "Penilai Uji Riwayat",
          "Catatan kedua.",
        ],
        [
          first,
          { startYear: 3270, term: "odd" },
          "mentor_observation",
          "Penilai Uji Riwayat",
          "Catatan pertama.",
        ],
      ]);
    });
  });

  it("never gives Catatan penilai to a role that only reads, and gives Ketua Program Studi nothing of another program", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, dina } = await addRecords(db);
      const kaprodi = await addTestActor(
        db,
        "Kaprodi Uji Riwayat",
        ["head_of_program"],
        { studyProgramId: programId },
      );
      const visible = assessmentVisibleTo(kaprodi);

      const own = await readAssessmentHistory(db, visible, ani, false);
      const other = await readAssessmentHistory(db, visible, dina, false);

      expect(own?.entries).toHaveLength(2);
      expect(own?.entries.map((entry) => entry.note)).toEqual([null, null]);
      expect(JSON.stringify(own)).not.toContain("Catatan");
      expect(other).toBeNull();
    });
  });

  it("gives Pengasuh the history of their own mentees only", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi } = await addRecords(db);
      const pengasuh = await addTestActor(db, "Pengasuh Uji Riwayat", [
        "mentor",
      ]);
      await addTestGroup(db, { programId, year: 3270 }, pengasuh.id, [ani]);
      const visible = assessmentVisibleTo(pengasuh);

      const own = await readAssessmentHistory(db, visible, ani, false);
      const other = await readAssessmentHistory(db, visible, budi, false);

      expect(own?.entries).toHaveLength(2);
      expect(other).toBeNull();
    });
  });

  it("gives nothing of a student who is not Aktif", async () => {
    await inTestDatabase(async (db) => {
      const { programId, penilai } = await addRecords(db);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9986040009",
        name: "Mahasiswa Uji Riwayat Cuti",
        status: "on_leave",
      });

      const history = await readAssessmentHistory(
        db,
        assessmentVisibleTo(penilai),
        onLeave,
        true,
      );

      expect(history).toBeNull();
    });
  });
});
