import { describe, expect, it } from "vitest";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  TEST_DECIDED_AT,
} from "@/features/activities/test-records";
import type { Database } from "./connect";
import { activityAttendances } from "./schema";
import { withTestDatabase } from "./test-database";

/*
 * This file's own sample values: the Tahun akademik 2150, the program
 * UJITABELHADIR and the NIMs 9972000000 to 9972000099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  staffId: string;
  scheduleId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Tabel Hadir", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2150);
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2150-09-10",
  });
  const programId = await addTestProgram(db, "UJITABELHADIR");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972000001",
    name: "Mahasiswa Uji Tabel Hadir",
    cohortYear: 2149,
  });
  return { staffId: staff.id, scheduleId, studentId: student.studentId };
}

/** In a transaction of its own, so a refusal does not end the check's. */
function adding(
  db: Database,
  records: Records,
  attendance: Partial<typeof activityAttendances.$inferInsert> & {
    status: (typeof activityAttendances.$inferInsert)["status"];
  },
): Promise<string> {
  const { staffId, scheduleId, studentId } = records;
  return db.transaction((tx) =>
    addTestAttendance(tx, staffId, { scheduleId, studentId, ...attendance }),
  );
}

describe("an attendance at an activity", () => {
  it.each([
    ["two that wait", "waiting", "waiting"],
    ["one that waits and a valid one", "valid", "waiting"],
    ["two valid ones", "valid", "valid"],
  ] as const)(
    "is refused as the second of %s for one student and schedule",
    async (_kind, first, second) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        await adding(db, records, { status: first });

        await expect(adding(db, records, { status: second })).rejects.toThrow();
        expect(await db.select().from(activityAttendances)).toHaveLength(1);
      });
    },
  );

  it("is kept next to a rejected one and a dispensation of the same student and schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await adding(db, records, { status: "rejected" });
      await adding(db, records, { status: "dispensation", sentAt: null });
      await adding(db, records, { status: "waiting" });

      expect(await db.select().from(activityAttendances)).toHaveLength(3);
    });
  });

  it.each([
    ["that waits without the time its photo was sent", { sentAt: null }],
    ["that waits and is decided", { decidedAt: TEST_DECIDED_AT }],
  ])("is refused %s", async (_kind, wrong) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, { status: "waiting", ...wrong }),
      ).rejects.toThrow();
    });
  });

  it.each([
    ["without the time it was decided", { decidedAt: null }],
    ["without who decided it", { decidedBy: null }],
  ])("is refused when it is valid %s", async (_kind, wrong) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, { status: "valid", ...wrong }),
      ).rejects.toThrow();
    });
  });

  it("keeps one photo for one attendance only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const photoKey = "attendance-photos/uji";
      await adding(db, records, { status: "rejected", photoKey });

      await expect(
        adding(db, records, { status: "waiting", photoKey }),
      ).rejects.toThrow();
    });
  });
});
