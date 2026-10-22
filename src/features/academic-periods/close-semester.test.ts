// Sample Tahun akademik of this file: 5110 to 5111.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { fixedCharacterGrades, semesterClosings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActivity,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { addTestScore } from "@/features/mentoring/test-scores";
import { addTestEntry } from "@/features/siku/test-siku";
import { addTestActor, addTestUpload } from "@/features/skpm/test-skpm";
import { closeSemester } from "./close-semester";

/*
 * This file's own sample values: the Tahun akademik 5110 and 5111, the
 * program UJITUTUPSEMESTER, and the NIMs 9951310000 to 9951310099.
 */

const inTestDatabase = withTestDatabase();

/** A day of Genap 5110/5111, after Ganjil 5110/5111 has ended. */
const TODAY = "5111-03-10";

async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 5110);
  const programId = await addTestProgram(db, "UJITUTUPSEMESTER");
  // Angkatan 5109 is in semester 3 in Ganjil 5110/5111, and 4 in Genap.
  const student = (nim: string, name: string) =>
    addTestStudentAccount(db, programId, { nim, name, cohortYear: 5109 });
  const ani = await student("9951310001", "Ani Uji Tutup Semester");
  const budi = await student("9951310002", "Budi Uji Tutup Semester");
  const kepala = await addTestActor(db, "Kepala Uji Tutup Semester", [
    "head_of_unit",
  ]);
  const mentor = await addTestActor(db, "Pengasuh Uji Tutup Semester", [
    "mentor",
  ]);
  return { ...periods, ani, budi, kepala, mentor };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

/**
 * In Ganjil: Ani attends one of two schedules and gets 80 from her
 * Pengasuh. In Genap: she attends one more and gets 60. An SKPM upload of
 * 36 points counts, and a SIKU gain of 5 is entered in Genap. Budi has no
 * score from a Pengasuh, so his grade is "Belum lengkap".
 */
async function addParts(db: Database, records: Records) {
  const { kepala, ani } = records;
  const oddActivity = await addTestActivity(db, kepala.id);
  const evenActivity = await addTestActivity(db, kepala.id, { semester: 4 });
  const schedule = (activityId: string, periodId: string, startsOn: string) =>
    addTestSchedule(db, {
      activityId,
      academicPeriodId: periodId,
      changedBy: kepala.id,
      startsOn,
    });
  const attended = await schedule(oddActivity, records.oddId, "5110-10-01");
  await schedule(oddActivity, records.oddId, "5110-10-02");
  const later = await schedule(evenActivity, records.evenId, "5111-03-02");
  for (const scheduleId of [attended, later]) {
    await addTestAttendance(db, kepala.id, {
      scheduleId,
      studentId: ani.studentId,
      status: "valid",
    });
  }
  const score = (periodId: string, value: number) =>
    addTestScore(db, {
      studentId: ani.studentId,
      periodId,
      score: value,
      scoredBy: records.mentor.id,
    });
  await score(records.oddId, 80);
  await score(records.evenId, 60);
  await addTestUpload(db, kepala, {
    mode: "add",
    periodId: records.oddId,
    enteredAt: new Date("5110-12-01T03:00:00Z"),
    rows: [{ studentId: ani.studentId, points: 36 }],
  });
  await addTestEntry(db, kepala, {
    kind: "gain",
    reason: "knowledge_sharing",
    points: 5,
    day: "5111-03-05",
    periodId: records.evenId,
    studentIds: [ani.studentId],
  });
}

/** The grades a closing of the period fixed, by name of the student. */
async function fixedGrades(db: Database, periodId: string) {
  return db
    .select({ grade: fixedCharacterGrades })
    .from(fixedCharacterGrades)
    .innerJoin(
      semesterClosings,
      eq(semesterClosings.id, fixedCharacterGrades.closingId),
    )
    .where(eq(semesterClosings.periodId, periodId))
    .orderBy(asc(fixedCharacterGrades.attended));
}

async function closings(db: Database) {
  return db.select().from(semesterClosings);
}

describe("the order of closings", () => {
  /** A day after Genap 5110/5111 has ended too. */
  const AFTER_BOTH = "5111-08-15";

  it("refuses a later period while an earlier one is not closed, and names it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const close = (id: string) =>
        closeSemester(db, records.kepala, id, true, AFTER_BOTH);

      expect(await close(records.evenId)).toEqual({
        ok: false,
        error:
          "Semester Ganjil 5110/5111 belum ditutup. Tutup semester itu terlebih dahulu.",
      });
      expect(await closings(db)).toEqual([]);
      expect(await close(records.oddId)).toEqual({
        ok: true,
        value: "Ganjil 5110/5111",
      });
      expect(await close(records.evenId)).toEqual({
        ok: true,
        value: "Genap 5110/5111",
      });
    });
  });
});

describe("the line in the change log", () => {
  it("says who closed which period, when, and how many grades it kept", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addParts(db, records);
      const before = new Date();

      await closeSemester(db, records.kepala, records.oddId, true, TODAY);

      const [line, ...more] = await closings(db);
      expect(more).toEqual([]);
      expect(line).toMatchObject({
        periodId: records.oddId,
        closedBy: records.kepala.id,
        students: 2,
        complete: 1,
        incomplete: 1,
      });
      expect(line?.closedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000,
      );
    });
  });
});

describe("closing a semester", () => {
  it("keeps nothing without the tick", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const closed = await closeSemester(
        db,
        records.kepala,
        records.oddId,
        false,
        TODAY,
      );

      expect(closed).toEqual({
        ok: false,
        error: "Centang konfirmasi terlebih dahulu.",
      });
      expect(await closings(db)).toEqual([]);
    });
  });

  it("refuses every role but Kepala Unit, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const closed = await closeSemester(
        db,
        records.mentor,
        records.oddId,
        true,
        TODAY,
      );

      expect(closed).toEqual({
        ok: false,
        error: "Anda tidak berhak menutup semester.",
      });
      expect(await closings(db)).toEqual([]);
    });
  });

  it("refuses a period that has not ended", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const close = (id: string) =>
        closeSemester(db, records.kepala, id, true, "5111-01-31");

      expect(await close(records.oddId)).toEqual({
        ok: false,
        error:
          "Semester ini belum selesai. Semester dapat ditutup setelah tanggal selesainya lewat.",
      });
      expect(await closings(db)).toEqual([]);
    });
  });

  it("refuses a period that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const close = (id: string) =>
        closeSemester(db, records.kepala, id, true, TODAY);
      const missing = { ok: false, error: "Periode tidak ditemukan." };

      expect(await close("bukan-periode")).toEqual(missing);
      expect(await close(crypto.randomUUID())).toEqual(missing);
    });
  });

  it("fixes every Aktif student's grade: Kehadiran and Pengasuhan of the closed period, SIKU and SKPM as they stand now", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addParts(db, records);

      const closed = await closeSemester(
        db,
        records.kepala,
        records.oddId,
        true,
        TODAY,
      );

      expect(closed).toEqual({ ok: true, value: "Ganjil 5110/5111" });
      const [budi, ani] = (await fixedGrades(db, records.oddId)).map(
        (row) => row.grade,
      );
      expect(ani).toMatchObject({
        studentId: records.ani.studentId,
        attendance: 50,
        attended: 1,
        counted: 2,
        mentoring: 80,
        siku: 70,
        sikuAdjusted: true,
        sikuNote: "SIKU 65 +5",
        skpm: 72,
        // 50, 80, 70 and 72 with 25% each.
        final: 68,
        letter: "C",
        passes: false,
        limited: false,
        limitedFrom: null,
      });
      expect(budi).toMatchObject({
        studentId: records.budi.studentId,
        attendance: 0,
        attended: 0,
        counted: 2,
        mentoring: null,
        siku: 65,
        sikuNote: "SIKU dasar 65",
        skpm: 0,
        final: null,
        letter: null,
        passes: null,
      });
    });
  });
});
