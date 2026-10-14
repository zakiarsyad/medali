// Sample Tahun akademik of this file: 2770 to 2770.
import { describe, expect, it } from "vitest";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import type { Database } from "./connect";
import { activityScheduleParticipants } from "./schema";
import { withTestDatabase } from "./test-database";

/*
 * This file's own sample values: the Tahun akademik 2770, the program
 * UJITABELPESERTA and the NIMs 9974400000 to 9974400099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  scheduleId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Tabel Peserta", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id, { semester: null });
  const periods = await addTestPeriods(db, 2770);
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2770-09-10",
  });
  const programId = await addTestProgram(db, "UJITABELPESERTA");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9974400001",
    name: "Mahasiswa Uji Tabel Peserta",
    cohortYear: 2769,
  });
  return { scheduleId, studentId: student.studentId };
}

type Participant = Partial<typeof activityScheduleParticipants.$inferInsert>;

/** In a transaction of its own, so a refusal does not end the check's. */
function adding(db: Database, scheduleId: string, rows: Participant[]) {
  return db.transaction((tx) =>
    tx
      .insert(activityScheduleParticipants)
      .values(rows.map((row) => ({ scheduleId, ...row }))),
  );
}

describe("a participant of a schedule", () => {
  it("is kept when it names one student, one class or one angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { scheduleId, studentId } = await addRecords(db);

      await adding(db, scheduleId, [
        { studentId },
        { className: "2-01" },
        { cohortYear: 2769 },
      ]);

      expect(await db.select().from(activityScheduleParticipants)).toHaveLength(
        3,
      );
    });
  });

  it.each([
    ["names nobody", {}],
    [
      "names a class and an angkatan at once",
      { className: "2-01", cohortYear: 2769 },
    ],
  ])("is refused when it %s", async (_kind, wrong: Participant) => {
    await inTestDatabase(async (db) => {
      const { scheduleId } = await addRecords(db);

      await expect(adding(db, scheduleId, [wrong])).rejects.toThrow();
    });
  });

  it.each([
    ["student", (studentId: string) => ({ studentId })],
    ["class", () => ({ className: "2-01" })],
    ["angkatan", () => ({ cohortYear: 2769 })],
  ])(
    "is refused when the schedule names the same %s twice",
    async (_kind, rowOf) => {
      await inTestDatabase(async (db) => {
        const { scheduleId, studentId } = await addRecords(db);

        const twice = adding(db, scheduleId, [
          rowOf(studentId),
          rowOf(studentId),
        ]);

        await expect(twice).rejects.toThrow();
      });
    },
  );
});
