// Sample Tahun akademik of this file: 2730 to 2730.
import { eq, inArray, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activityScheduleParticipants,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readAbsent } from "./absent-students";
import { readAttendanceCounts } from "./attendance-counts";
import { readAttendanceNumbers } from "./attendance-numbers";
import { readCohortCounts } from "./cohort-counts";
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
 * This file's own sample values: the Tahun akademik 2730, the programs
 * UJITAMBAHAN and UJITAMBAHANLAIN and the NIMs 9974600000 to
 * 9974600099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "2730-09-20";
const EXTRA: ScheduleScope = { kind: "extra" };
const EVERY_PPKS: ScheduleScope = { kind: "ppks", level: null };

interface Records {
  /** The students of both programs, as a role that sees every student would. */
  everyone: SQL;
  /** The students of the first program, as its Ketua Program Studi would. */
  ownProgram: SQL;
  /** For class T-01, held on 10 September. */
  byClass: string;
  /** For Budi and Cici by name, held on 15 September. */
  byStudent: string;
  /** For angkatan 2728 and 2729, still to come on 1 October. */
  byCohorts: string;
  /** A PPKS schedule of 12 September. */
  ppks: string;
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
 * Of the first program: Ani and Budi of angkatan 2729 in classes T-01
 * and T-02, Cici of angkatan 2728 in T-01 who is Non aktif, and Dodi of
 * angkatan 2728 in T-03. Of the other program: Eka of angkatan 2729 in
 * T-01.
 */
async function addStudents(db: Database) {
  const programId = await addTestProgram(db, "UJITAMBAHAN");
  const otherProgramId = await addTestProgram(db, "UJITAMBAHANLAIN");
  await addTestStudents(db, programId, [
    {
      nim: "9974600001",
      name: "Ani Uji Tambahan",
      cohortYear: 2729,
      className: "T-01",
    },
    {
      nim: "9974600002",
      name: "Budi Uji Tambahan",
      cohortYear: 2729,
      className: "T-02",
    },
    {
      nim: "9974600003",
      name: "Cici Uji Tambahan",
      cohortYear: 2728,
      className: "T-01",
      status: "inactive",
    },
    {
      nim: "9974600004",
      name: "Dodi Uji Tambahan",
      cohortYear: 2728,
      className: "T-03",
    },
  ]);
  await addTestStudents(db, otherProgramId, [
    {
      nim: "9974600005",
      name: "Eka Uji Tambahan",
      cohortYear: 2729,
      className: "T-01",
    },
  ]);
  return {
    everyone: inArray(students.studyProgramId, [programId, otherProgramId]),
    ownProgram: eq(students.studyProgramId, programId),
  };
}

/**
 * At the schedule of class T-01: Ani was present, Eka's photo waits, and
 * Dodi, who was chosen before the class took his place, has a valid photo
 * that stays stored. At the PPKS schedule Ani's photo waits.
 */
async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Tambahan", ["upk_staff"]);
  const extraId = await addTestActivity(db, staff.id, { semester: null });
  const ppksId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2730);
  const visible = await addStudents(db);
  const base = { academicPeriodId: periods.oddId, changedBy: staff.id };
  const extra = { ...base, activityId: extraId };
  const byClass = await addTestSchedule(db, {
    ...extra,
    startsOn: "2730-09-10",
  });
  const byStudent = await addTestSchedule(db, {
    ...extra,
    startsOn: "2730-09-15",
  });
  const byCohorts = await addTestSchedule(db, {
    ...extra,
    startsOn: "2730-10-01",
  });
  const ppks = await addTestSchedule(db, {
    ...base,
    activityId: ppksId,
    startsOn: "2730-09-12",
  });
  await db.insert(activityScheduleParticipants).values([
    { scheduleId: byClass, className: "T-01" },
    { scheduleId: byStudent, studentId: await idOf(db, "9974600002") },
    { scheduleId: byStudent, studentId: await idOf(db, "9974600003") },
    { scheduleId: byCohorts, cohortYear: 2728 },
    { scheduleId: byCohorts, cohortYear: 2729 },
  ]);
  async function attend(
    scheduleId: string,
    nim: string,
    status: "waiting" | "valid",
  ) {
    const studentId = await idOf(db, nim);
    await addTestAttendance(db, staff.id, { scheduleId, studentId, status });
  }
  await attend(byClass, "9974600001", "valid");
  await attend(byClass, "9974600005", "waiting");
  await attend(byClass, "9974600004", "valid");
  await attend(ppks, "9974600001", "waiting");
  return { ...visible, byClass, byStudent, byCohorts, ppks };
}

async function listedExtra(db: Database): Promise<ScheduleRow[]> {
  return (await listSchedules(db, EXTRA, 1)).schedules;
}

describe("listSchedules on Kegiatan tambahan", () => {
  it("lists only the schedules of the extra activities, the earliest first, each with its choice and its Aktif participants", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const list = await listSchedules(db, EXTRA, 1);

      expect(list.matching).toBe(3);
      expect(list.schedules.map(({ id }) => id)).toEqual([
        records.byClass,
        records.byStudent,
        records.byCohorts,
      ]);
      expect(list.schedules.map(({ target }) => target)).toEqual([
        {
          kind: "chosen",
          choice: { kind: "classes", classNames: ["T-01"] },
          participants: 2,
        },
        // Cici is Non aktif: she stays chosen but is not counted.
        {
          kind: "chosen",
          choice: { kind: "students", chosen: 2 },
          participants: 1,
        },
        {
          kind: "chosen",
          choice: { kind: "cohorts", cohortYears: [2728, 2729] },
          participants: 4,
        },
      ]);
    });
  });

  it("leaves the schedules of the extra activities off Kegiatan PPKS", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const list = await listSchedules(db, EVERY_PPKS, 1);

      expect(list.schedules.map(({ id }) => id)).toEqual([records.ppks]);
    });
  });
});

describe("the attendance of a schedule of an extra activity", () => {
  async function countsFor(db: Database, visible: SQL) {
    const cohorts = await readCohortCounts(db);
    const schedules = await listedExtra(db);
    return readAttendanceCounts(db, visible, schedules, cohorts, TODAY);
  }

  it("counts only the Aktif students it names: a valid photo of a student it no longer names stays stored and does not count", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, records.everyone);

      expect(counts[records.byClass]).toEqual({
        targeted: 2,
        present: 1,
        waiting: 1,
        dispensations: 0,
      });
      expect(counts[records.byStudent]).toEqual({
        targeted: 1,
        present: 0,
        waiting: 0,
        dispensations: 0,
      });
      expect(counts[records.byCohorts]).toBeUndefined();
      const dodis = await db
        .select()
        .from(activityAttendances)
        .where(eq(activityAttendances.studentId, await idOf(db, "9974600004")));
      expect(dodis).toHaveLength(1);
    });
  });

  it("counts only the students the account sees: Ketua Program Studi gets those of their program", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await countsFor(db, records.ownProgram);

      expect(counts[records.byClass]).toEqual({
        targeted: 1,
        present: 1,
        waiting: 0,
        dispensations: 0,
      });
    });
  });

  it("lists in Peserta the Aktif students it names who did not attend", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const schedules = await listedExtra(db);
      const byStudent = schedules.find(({ id }) => id === records.byStudent);
      if (!byStudent) throw new Error("The schedule is not listed.");

      const absent = await readAbsent(
        db,
        records.everyone,
        byStudent,
        await readCohortCounts(db),
        1,
      );

      expect(absent).toMatchObject({ targeted: 1, absent: 1 });
      expect(absent.students).toEqual([
        { name: "Budi Uji Tambahan", nim: "9974600002" },
      ]);
    });
  });
});

describe("readAttendanceNumbers on each tab", () => {
  it("counts the schedules and the waiting photos of the tab's own kind of activity", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const extra = await readAttendanceNumbers(
        db,
        records.everyone,
        EXTRA,
        TODAY,
      );
      const ppks = await readAttendanceNumbers(
        db,
        records.everyone,
        EVERY_PPKS,
        TODAY,
      );

      expect(extra).toMatchObject({ held: 2, coming: 1, waiting: 1 });
      expect(ppks).toMatchObject({ held: 1, coming: 0, waiting: 1 });
    });
  });
});
