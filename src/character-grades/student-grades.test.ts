// Sample Tahun akademik of this file: 4500 to 4500.
import { and, asc, eq, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActivity,
  addTestAttendance,
  addTestMentorGroup,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { addTestScore } from "@/features/mentoring/test-scores";
import { addTestActor, addTestUpload } from "@/features/skpm/test-skpm";
import { readStudentGrade } from "./student-grade";
import { gradeChoiceSql, readGradesOf } from "./student-grades";

/*
 * This file's own sample values: the Tahun akademik 4500, the programs
 * UJINILAIMAHASISWA and UJINILAIMAHASISWAB, and the NIMs 9989300000 to
 * 9989300099.
 */

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 4500/4501, which runs then. */
const TODAY = "4500-10-20";

/**
 * Ani passes (100, 80, 65 and 72 give 79,3, B), Budi does not (0, 80, 65
 * and 0 give 36,3, E), Citra has no Pengasuhan score, so hers is "Belum
 * lengkap", and Dodi of the other program passes as Ani does.
 */
async function addRecords(db: Database) {
  const { oddId: periodId } = await addTestPeriods(db, 4500);
  const programId = await addTestProgram(db, "UJINILAIMAHASISWA");
  const otherId = await addTestProgram(db, "UJINILAIMAHASISWAB");
  const student = (program: number, nim: string, name: string) =>
    addTestStudentAccount(db, program, { nim, name, cohortYear: 4499 });
  const ani = await student(programId, "9989300001", "Ani Uji Nilai Daftar");
  const budi = await student(programId, "9989300002", "Budi Uji Nilai Daftar");
  const citra = await student(programId, "9989300003", "Citra Uji Nilai");
  const dodi = await student(otherId, "9989300004", "Dodi Uji Nilai Daftar");
  const kepala = await addTestActor(db, "Kepala Uji Nilai Daftar", [
    "head_of_unit",
  ]);
  const scheduleId = await addTestSchedule(db, {
    activityId: await addTestActivity(db, kepala.id),
    academicPeriodId: periodId,
    changedBy: kepala.id,
    startsOn: "4500-10-01",
  });
  for (const each of [ani, dodi]) {
    await addTestAttendance(db, kepala.id, {
      scheduleId,
      studentId: each.studentId,
      status: "valid",
    });
  }
  for (const each of [ani, budi, dodi]) {
    await addTestScore(db, {
      studentId: each.studentId,
      periodId,
      score: 80,
      scoredBy: kepala.id,
    });
  }
  await addTestUpload(db, kepala, {
    mode: "add",
    periodId,
    enteredAt: new Date("4500-10-10T03:00:00Z"),
    rows: [ani, dodi].map((each) => ({
      studentId: each.studentId,
      points: 36,
    })),
  });
  return {
    programId,
    kepala,
    ani: ani.studentId,
    budi: budi.studentId,
    citra: citra.studentId,
    dodi: dodi.studentId,
    ownProgram: eq(students.studyProgramId, programId),
  };
}

/** The ids of the students of `visible` that `condition` lets through, by name. */
async function idsWhere(
  db: Database,
  visible: SQL,
  condition: SQL,
): Promise<string[]> {
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(and(visible, condition))
    .orderBy(asc(students.name));
  return rows.map((row) => row.id);
}

describe("readGradesOf", () => {
  it("gives each asked student's grade by the scheme in force", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const grades = await readGradesOf(
        db,
        records.ownProgram,
        [records.ani, records.budi, records.citra],
        TODAY,
      );

      expect(grades.get(records.ani)).toEqual({
        complete: true,
        final: 79.3,
        letter: "B",
        passes: true,
      });
      expect(grades.get(records.budi)).toEqual({
        complete: true,
        final: 36.3,
        letter: "E",
        passes: false,
      });
      expect(grades.get(records.citra)).toEqual({ complete: false });
    });
  });

  it("reads only the asked students that `visible` lets through", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const grades = await readGradesOf(
        db,
        records.ownProgram,
        [records.ani, records.dodi],
        TODAY,
      );

      expect([...grades.keys()]).toEqual([records.ani]);
      expect(await readGradesOf(db, records.ownProgram, [], TODAY)).toEqual(
        new Map(),
      );
    });
  });
});

describe("gradeChoiceSql", () => {
  it("finds those who reach the pass letter, or those who do not, leaving out every grade that is Belum lengkap", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const visible = records.ownProgram;

      const passing = await gradeChoiceSql(db, visible, "passing", TODAY);
      const failing = await gradeChoiceSql(db, visible, "failing", TODAY);

      expect(await idsWhere(db, visible, passing)).toEqual([records.ani]);
      expect(await idsWhere(db, visible, failing)).toEqual([records.budi]);
    });
  });

  it("works the grade out only for the students `visible` lets through", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const passing = await gradeChoiceSql(
        db,
        records.ownProgram,
        "passing",
        TODAY,
      );

      expect(
        await idsWhere(db, eq(students.id, records.dodi), passing),
      ).toEqual([]);
    });
  });
});

describe("readStudentGrade", () => {
  it("gives the student's four parts, the grade and the scheme it is worked out by", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const shown = await readStudentGrade(
        db,
        records.kepala,
        records.ani,
        TODAY,
      );

      expect(shown?.row).toMatchObject({
        student: { id: records.ani },
        attendance: { percent: 100 },
        mentoring: 80,
        siku: { score: 65 },
        skpm: 72,
        grade: { complete: true, final: 79.3, letter: "B", passes: true },
      });
      expect(shown?.scheme.passLetter).toBe("B");
      expect(shown?.scheme.weights.attendance).toBe(25);
    });
  });

  it("refuses a role without the character panels, the same whether or not the grade is complete", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const konselor = await addTestActor(db, "Konselor Uji Nilai", [
        "counsellor",
      ]);

      for (const student of [records.ani, records.citra]) {
        expect(await readStudentGrade(db, konselor, student, TODAY)).toBeNull();
      }
    });
  });

  it("refuses a student outside the program of Ketua Program Studi or the mentees of Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const kaprodi = await addTestActor(
        db,
        "Kaprodi Uji Nilai Daftar",
        ["head_of_program"],
        { studyProgramId: records.programId },
      );
      const mentor = await addTestActor(db, "Pengasuh Uji Nilai Daftar", [
        "mentor",
      ]);
      await addTestMentorGroup(db, {
        studyProgramId: records.programId,
        cohortYear: 4499,
        number: 1,
        mentorId: mentor.id,
        memberIds: [records.ani],
      });

      expect(
        await readStudentGrade(db, kaprodi, records.ani, TODAY),
      ).not.toBeNull();
      expect(
        await readStudentGrade(db, kaprodi, records.dodi, TODAY),
      ).toBeNull();
      expect(
        await readStudentGrade(db, mentor, records.ani, TODAY),
      ).not.toBeNull();
      expect(
        await readStudentGrade(db, mentor, records.budi, TODAY),
      ).toBeNull();
    });
  });

  it("gives nothing for a student who is not Aktif, an id of nobody, or a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, records.budi));

      for (const asked of [records.budi, crypto.randomUUID(), "9989300001"]) {
        expect(
          await readStudentGrade(db, records.kepala, asked, TODAY),
        ).toBeNull();
      }
    });
  });
});
