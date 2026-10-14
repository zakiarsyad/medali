// Sample Tahun akademik of this file: 2270 to 2270.
import { eq, inArray, type SQL, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readAbsent } from "./absent-students";
import { readAttendanceCounts } from "./attendance-counts";
import { readAttendanceNumbers } from "./attendance-numbers";
import { readCohortCounts } from "./cohort-counts";
import { readListAttendance } from "./list-attendance";
import { listSchedules } from "./list-schedules";
import type { ScheduleScope } from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudents,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2270, the programs
 * UJIHADIRJADWAL and UJIHADIRJADWALLAIN and the NIMs 9973300000 to
 * 9973300099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "2270-09-20";
const NOBODY = sql`false`;
const EVERY_PPKS: ScheduleScope = { kind: "ppks", level: null };

interface Records {
  staffId: string;
  activityId: string;
  periodId: string;
  /** The students of both programs, as a role that sees every student would. */
  everyone: SQL;
  /** The students of the first program, as its Ketua Program Studi would. */
  ownProgram: SQL;
  otherProgramId: number;
  /** A required schedule of 10 September, whose upload time has closed. */
  held: string;
  /** A required schedule of 25 September, which is still to come. */
  coming: string;
  /** A schedule of 15 September that is not required. */
  free: string;
}

async function idOf(db: Database, nim: string): Promise<string> {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, nim));
  if (!student) throw new Error(`No student has the NIM ${nim}.`);
  return student.id;
}

/**
 * Angkatan 2269 is in semester 3 during Ganjil 2270, which the activity
 * is for. Of the first program: Arya with a valid photo, Bima whose
 * photo waits, Citra with a dispensation, Dewi whose photo was rejected,
 * Eka on Cuti, and Fajar of angkatan 2270, for whom it is not meant. Of
 * the other program: Gilang, valid after a rejection, and Hana with
 * nothing sent.
 */
async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Hadir Jadwal", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2270);
  const programId = await addTestProgram(db, "UJIHADIRJADWAL");
  const otherProgramId = await addTestProgram(db, "UJIHADIRJADWALLAIN");
  const third = { cohortYear: 2269 };
  await addTestStudents(db, programId, [
    { nim: "9973300001", name: "Arya Uji Hadir", ...third },
    { nim: "9973300002", name: "Bima Uji Hadir", ...third },
    { nim: "9973300003", name: "Citra Uji Hadir", ...third },
    { nim: "9973300004", name: "Dewi Uji Hadir", ...third },
    { nim: "9973300005", name: "Eka Uji Hadir", ...third, status: "on_leave" },
    { nim: "9973300006", name: "Fajar Uji Hadir", cohortYear: 2270 },
  ]);
  await addTestStudents(db, otherProgramId, [
    { nim: "9973300007", name: "Gilang Uji Hadir", ...third },
    { nim: "9973300008", name: "Hana Uji Hadir", ...third },
  ]);
  const schedule = {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
  };
  const held = await addTestSchedule(db, {
    ...schedule,
    startsOn: "2270-09-10",
  });
  const coming = await addTestSchedule(db, {
    ...schedule,
    startsOn: "2270-09-25",
  });
  const free = await addTestSchedule(db, {
    ...schedule,
    startsOn: "2270-09-15",
    isRequired: false,
  });
  async function attend(
    nim: string,
    status: "waiting" | "valid" | "rejected" | "dispensation",
    sentAt: Date | null,
  ) {
    const studentId = await idOf(db, nim);
    await addTestAttendance(db, staff.id, {
      scheduleId: held,
      studentId,
      status,
      sentAt,
    });
  }
  const morning = new Date("2270-09-10T03:00:00Z");
  const noon = new Date("2270-09-10T05:00:00Z");
  await attend("9973300001", "valid", morning);
  await attend("9973300002", "waiting", morning);
  await attend("9973300003", "dispensation", null);
  await attend("9973300004", "rejected", morning);
  await attend("9973300007", "rejected", morning);
  await attend("9973300007", "valid", noon);
  return {
    staffId: staff.id,
    activityId,
    periodId: periods.oddId,
    everyone: inArray(students.studyProgramId, [programId, otherProgramId]),
    ownProgram: eq(students.studyProgramId, programId),
    otherProgramId,
    held,
    coming,
    free,
  };
}

async function listed(db: Database): Promise<ScheduleRow[]> {
  const list = await listSchedules(db, { kind: "ppks", level: null }, 1);
  return list.schedules;
}

async function countsFor(db: Database, visible: SQL) {
  const cohorts = await readCohortCounts(db);
  return readAttendanceCounts(db, visible, await listed(db), cohorts, TODAY);
}

async function absentFor(
  db: Database,
  visible: SQL,
  scheduleId: string,
  page = 1,
) {
  const schedule = (await listed(db)).find(({ id }) => id === scheduleId);
  if (!schedule) throw new Error("The schedule is not listed.");
  const cohorts = await readCohortCounts(db);
  return readAbsent(db, visible, schedule, cohorts, page);
}

describe("readAttendanceCounts", () => {
  it("counts the Aktif students a started schedule is meant for: present, waiting and with a dispensation, by the newest attendance of each", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, records.everyone);

      expect(counts[records.held]).toEqual({
        targeted: 6,
        present: 2,
        waiting: 1,
        dispensations: 1,
      });
      expect(counts[records.free]).toEqual({
        targeted: 6,
        present: 0,
        waiting: 0,
        dispensations: 0,
      });
    });
  });

  it("gives no numbers to a schedule that has not started", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, records.everyone);

      expect(counts[records.coming]).toBeUndefined();
      expect(Object.keys(counts).sort()).toEqual(
        [records.held, records.free].sort(),
      );
    });
  });

  it("counts only the students the account sees: Ketua Program Studi gets those of their program", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, records.ownProgram);

      expect(counts[records.held]).toEqual({
        targeted: 4,
        present: 1,
        waiting: 1,
        dispensations: 1,
      });
    });
  });

  it("counts nobody for an account that sees no student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, NOBODY);

      expect(counts[records.held]).toEqual({
        targeted: 0,
        present: 0,
        waiting: 0,
        dispensations: 0,
      });
    });
  });
});

describe("readAbsent", () => {
  it("lists the students with nothing sent or a rejected photo, by name, with how many the schedule is meant for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const absent = await absentFor(db, records.everyone, records.held);

      expect(absent).toEqual({
        scheduleId: records.held,
        targeted: 6,
        absent: 2,
        students: [
          { name: "Dewi Uji Hadir", nim: "9973300004" },
          { name: "Hana Uji Hadir", nim: "9973300008" },
        ],
        page: 1,
      });
    });
  });

  it("names only the students the account sees: no student of another program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const absent = await absentFor(db, records.ownProgram, records.held);

      expect(absent).toMatchObject({
        targeted: 4,
        absent: 1,
        students: [{ name: "Dewi Uji Hadir", nim: "9973300004" }],
      });
      expect(await absentFor(db, NOBODY, records.held)).toMatchObject({
        targeted: 0,
        absent: 0,
        students: [],
      });
    });
  });

  it("shows 40 students a page, and the last page when a later one is asked for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestStudents(
        db,
        records.otherProgramId,
        Array.from({ length: 41 }, (_, index) => ({
          nim: `99733000${String(index + 20)}`,
          name: `Indra Uji Hadir ${String(index + 20)}`,
          cohortYear: 2269,
        })),
      );

      const first = await absentFor(db, records.everyone, records.held);
      const last = await absentFor(db, records.everyone, records.held, 9);

      expect(first).toMatchObject({ targeted: 47, absent: 43, page: 1 });
      expect(first.students).toHaveLength(40);
      expect(first.students[0]?.name).toBe("Dewi Uji Hadir");
      expect(last.page).toBe(2);
      expect(last.students.map(({ name }) => name)).toEqual([
        "Indra Uji Hadir 58",
        "Indra Uji Hadir 59",
        "Indra Uji Hadir 60",
      ]);
    });
  });
});

describe("readListAttendance", () => {
  async function attendance(db: Database, records: Records, openId: string) {
    return readListAttendance(
      db,
      records.everyone,
      await listed(db),
      await readCohortCounts(db),
      { scheduleId: openId, page: 1 },
      TODAY,
    );
  }

  it("reads the students of Peserta only for the schedule the address asks for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const schedules = await listed(db);
      const cohorts = await readCohortCounts(db);

      const closed = await readListAttendance(
        db,
        records.everyone,
        schedules,
        cohorts,
        null,
        TODAY,
      );
      const opened = await attendance(db, records, records.held);

      expect(closed.absent).toBeNull();
      expect(closed.counts[records.held]?.present).toBe(2);
      expect(opened.absent).toMatchObject({
        scheduleId: records.held,
        absent: 2,
      });
    });
  });

  it("opens no Peserta for a schedule that has not started or is not on the page", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const openId of [records.coming, unknown]) {
        const { absent } = await attendance(db, records, openId);

        expect(absent).toBeNull();
      }
    });
  });
});

describe("readAttendanceNumbers", () => {
  it("counts the required schedules that have started, those still to come, and the photos that wait", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const numbers = await readAttendanceNumbers(
        db,
        records.everyone,
        EVERY_PPKS,
        TODAY,
      );

      expect(numbers).toMatchObject({ held: 1, coming: 1, waiting: 1 });
    });
  });

  it("is the mean of Nilai kehadiran of the students who have one: a dispensation, Cuti and an angkatan with no activity are left out", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const { mean } = await readAttendanceNumbers(
        db,
        records.everyone,
        EVERY_PPKS,
        TODAY,
      );

      // Arya and Gilang at 100, Bima, Dewi and Hana at 0.
      expect(mean).toEqual({ percent: 40, students: 5 });
    });
  });

  it("gives Ketua Program Studi the mean and the waiting photos of their own students only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = eq(students.studyProgramId, records.otherProgramId);

      const own = await readAttendanceNumbers(
        db,
        records.ownProgram,
        EVERY_PPKS,
        TODAY,
      );
      const others = await readAttendanceNumbers(db, other, EVERY_PPKS, TODAY);
      const none = await readAttendanceNumbers(db, NOBODY, EVERY_PPKS, TODAY);

      expect(own.mean).toEqual({ percent: 33.3, students: 3 });
      expect(own.waiting).toBe(1);
      expect(others.mean).toEqual({ percent: 50, students: 2 });
      expect(others.waiting).toBe(0);
      expect(none.mean).toEqual({ percent: null, students: 0 });
      expect(none.waiting).toBe(0);
      // The schedules themselves are no student's data: all see them.
      expect(none).toMatchObject({ held: 1, coming: 1 });
    });
  });

  it("follows the tahap chosen for the two numbers that count schedules", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { everyone } = records;

      const second = await readAttendanceNumbers(
        db,
        everyone,
        { kind: "ppks", level: 2 },
        TODAY,
      );
      const first = await readAttendanceNumbers(
        db,
        everyone,
        { kind: "ppks", level: 1 },
        TODAY,
      );

      expect(second).toMatchObject({ held: 1, coming: 1 });
      expect(first).toMatchObject({ held: 0, coming: 0, waiting: 1 });
      expect(first.mean).toEqual(second.mean);
    });
  });

  it("counts a dispensation recorded for a missed activity out of the mean", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestAttendance(db, records.staffId, {
        scheduleId: records.held,
        studentId: await idOf(db, "9973300008"),
        status: "dispensation",
        sentAt: null,
      });

      const { mean } = await readAttendanceNumbers(
        db,
        records.everyone,
        EVERY_PPKS,
        TODAY,
      );

      // Hana's 0 is gone: 200 over the four who are left.
      expect(mean).toEqual({ percent: 50, students: 4 });
    });
  });
});
