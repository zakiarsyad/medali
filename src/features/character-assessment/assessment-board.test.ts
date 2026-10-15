// Sample Tahun akademik of this file: 3250 to 3250.
// Sample NIMs of this file: 9986010000 to 9986010099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { START_PARAMS } from "./assessment-address";
import { readAssessmentList, readAssessmentNumbers } from "./assessment-board";
import { assessmentVisibleTo } from "./assessment-readers";
import {
  addTestActor,
  addTestAssessment,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

const inTestDatabase = withTestDatabase();

const ODD = new Date("3250-09-01T03:00:00Z");
const ODD_LATER = new Date("3250-10-01T03:00:00Z");
const EVEN = new Date("3251-03-01T03:00:00Z");

const LOW = { M: 60, E: 62, D: 58, A: 64, L: 60, I: 62 };
const GOLD = { M: 85, E: 85, D: 85, A: 85, L: 85, I: 85 };

async function addRecords(db: Database) {
  const odd = await addTestPeriod(db, 3250);
  const even = await addTestPeriod(db, 3250, "even");
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Asesmen",
    3250,
    ["9986010001", "9986010002", "9986010003"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Asesmen", ["assessor"]);
  return { odd, even, programId, ani, budi, citra, penilai };
}

describe("Hasil asesmen karakter for a role that sees every student", () => {
  it("shows each student's latest assessment with who entered it, the newest first and Belum diasesmen last", async () => {
    await inTestDatabase(async (db) => {
      const { odd, ani, budi, citra, penilai } = await addRecords(db);
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId: odd,
        enteredAt: ODD,
        scores: LOW,
      });
      await addTestAssessment(db, penilai, {
        studentId: budi,
        periodId: odd,
        enteredAt: ODD,
      });
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId: odd,
        enteredAt: ODD_LATER,
        scores: GOLD,
        source: "peer_assessment",
      });

      const list = await readAssessmentList(db, assessmentVisibleTo(penilai), {
        ...START_PARAMS,
        query: "Uji Asesmen",
      });

      expect(list.matching).toBe(3);
      expect(list.rows.map((row) => row.id)).toEqual([ani, budi, citra]);
      expect(list.rows[0]?.latest).toEqual({
        enteredAt: ODD_LATER,
        source: "peer_assessment",
        fileName: null,
        enteredBy: "Penilai Uji Asesmen",
        scores: GOLD,
      });
      expect(list.rows[2]?.latest).toBeNull();
    });
  });

  it("narrows the list to Belum diasesmen, and to a search by NIM", async () => {
    await inTestDatabase(async (db) => {
      const { odd, ani, budi, citra, penilai } = await addRecords(db);
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId: odd,
        enteredAt: ODD,
      });
      const visible = assessmentVisibleTo(penilai);

      const none = await readAssessmentList(db, visible, {
        ...START_PARAMS,
        query: "99860100",
        filter: "none",
      });
      const one = await readAssessmentList(db, visible, {
        ...START_PARAMS,
        query: "9986010002",
      });

      expect(none.rows.map((row) => row.id)).toEqual([budi, citra]);
      expect(one.rows.map((row) => row.id)).toEqual([budi]);
    });
  });

  it("keeps a student assessed in an earlier period in the list when a new semester runs: only Diasesmen semester ini starts again", async () => {
    await inTestDatabase(async (db) => {
      const { odd, even, programId, ani, budi, penilai } = await addRecords(db);
      await addTestAssessment(db, penilai, {
        studentId: ani,
        periodId: odd,
        enteredAt: ODD,
      });
      await addTestAssessment(db, penilai, {
        studentId: budi,
        periodId: even,
        enteredAt: EVEN,
        scores: GOLD,
      });
      const ofProgram = eq(students.studyProgramId, programId);

      const inOdd = await readAssessmentNumbers(db, ofProgram, odd);
      const inEven = await readAssessmentNumbers(db, ofProgram, even);
      const list = await readAssessmentList(db, ofProgram, START_PARAMS);

      expect(inOdd).toEqual({
        students: 3,
        assessed: 2,
        assessedThisPeriod: 1,
        notAssessed: 1,
        meanRerata: 82.7,
      });
      expect(inEven).toEqual({ ...inOdd, assessedThisPeriod: 1 });
      expect(list.rows.map((row) => row.latest !== null)).toEqual([
        true,
        true,
        false,
      ]);
    });
  });

  it("counts only Aktif students, and nobody this semester while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const { odd, programId, ani, penilai } = await addRecords(db);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9986010009",
        name: "Mahasiswa Uji Asesmen Cuti",
        status: "on_leave",
      });
      for (const studentId of [ani, onLeave]) {
        await addTestAssessment(db, penilai, {
          studentId,
          periodId: odd,
          enteredAt: ODD,
        });
      }
      const ofProgram = eq(students.studyProgramId, programId);

      const numbers = await readAssessmentNumbers(db, ofProgram, null);
      const list = await readAssessmentList(db, ofProgram, START_PARAMS);

      expect(numbers).toEqual({
        students: 3,
        assessed: 1,
        assessedThisPeriod: 0,
        notAssessed: 2,
        meanRerata: 80.3,
      });
      expect(list.rows.map((row) => row.id)).not.toContain(onLeave);
    });
  });
});

describe("Hasil asesmen karakter for a role that sees only some students", () => {
  async function addTwoPrograms(db: Database) {
    const records = await addRecords(db);
    const otherProgram = await addTestProgram(db, "Prodi Uji Asesmen Lain");
    const dina = await addTestStudent(db, otherProgram, {
      nim: "9986010011",
      name: "Mahasiswa Uji Asesmen Lain",
      cohortYear: 3250,
    });
    for (const studentId of [records.ani, dina]) {
      await addTestAssessment(db, records.penilai, {
        studentId,
        periodId: records.odd,
        enteredAt: ODD,
      });
    }
    return { ...records, dina };
  }

  it("shows Ketua Program Studi only the students of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi, citra } = await addTwoPrograms(db);
      const kaprodi = await addTestActor(
        db,
        "Kaprodi Uji Asesmen",
        ["head_of_program"],
        { studyProgramId: programId },
      );
      const visible = assessmentVisibleTo(kaprodi);

      const list = await readAssessmentList(db, visible, START_PARAMS);
      const numbers = await readAssessmentNumbers(db, visible, null);

      expect(list.rows.map((row) => row.id)).toEqual([ani, budi, citra]);
      expect(numbers).toMatchObject({ students: 3, assessed: 1 });
    });
  });

  it("shows Pengasuh only their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi } = await addTwoPrograms(db);
      const pengasuh = await addTestActor(db, "Pengasuh Uji Asesmen", [
        "mentor",
      ]);
      await addTestGroup(db, { programId, year: 3250 }, pengasuh.id, [
        ani,
        budi,
      ]);
      const visible = assessmentVisibleTo(pengasuh);

      const list = await readAssessmentList(db, visible, START_PARAMS);

      expect(list.rows.map((row) => row.id)).toEqual([ani, budi]);
    });
  });

  it("shows a student nothing, as a student holds no role that opens the tab", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addTwoPrograms(db);
      const student = await addTestActor(db, "Mahasiswa Uji Asesmen", [
        "student",
      ]);

      const list = await readAssessmentList(
        db,
        assessmentVisibleTo({ ...student, studentId: ani }),
        START_PARAMS,
      );

      expect(list.rows).toEqual([]);
    });
  });
});
