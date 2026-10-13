import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { activityAttendances, activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "@/files/memory-store";
import { PHOTO_FILE_NAME } from "./attendance-photo";
import { openAttendancePhoto } from "./open-attendance-photo";
import { sendAttendancePhoto } from "./send-attendance-photo";
import { testPhoto } from "./test-photo";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2190, the program
 * UJIBUKAFOTO and the NIMs 9972500000 to 9972500099.
 */

const inTestDatabase = withTestDatabase();

const WHILE_OPEN = new Date("2190-10-13T03:00:00Z");
const PHOTO = { name: PHOTO_FILE_NAME, bytes: testPhoto(80) };

interface Records {
  staffId: string;
  programId: number;
  store: MemoryStore;
  scheduleId: string;
  /** The student who sent the photo. */
  student: TestStudentAccount;
  /** The attendance the photo belongs to. */
  attendanceId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Buka Foto", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2190);
  const programId = await addTestProgram(db, "UJIBUKAFOTO");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972500001",
    name: "Mahasiswa Uji Buka Foto",
    cohortYear: 2189,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2190-10-13",
  });
  const store = memoryStore();
  await sendAttendancePhoto(db, store, student, scheduleId, PHOTO, WHILE_OPEN);
  const [attendance] = await db.select().from(activityAttendances);
  if (!attendance) throw new Error("The photo was not sent.");
  return {
    staffId: staff.id,
    programId,
    store,
    scheduleId,
    student,
    attendanceId: attendance.id,
  };
}

describe("openAttendancePhoto", () => {
  it("gives the student the photo they sent, unchanged", async () => {
    await inTestDatabase(async (db) => {
      const { store, student, attendanceId } = await addRecords(db);

      const opened = await openAttendancePhoto(
        db,
        store,
        student,
        attendanceId,
      );

      expect(opened).toEqual({
        ok: true,
        file: {
          name: "foto-kehadiran.jpg",
          contentType: "image/jpeg",
          bytes: PHOTO.bytes,
        },
      });
    });
  });

  it("refuses a visitor who is not signed in", async () => {
    await inTestDatabase(async (db) => {
      const { store, attendanceId } = await addRecords(db);

      expect(await openAttendancePhoto(db, store, null, attendanceId)).toEqual({
        ok: false,
        refusal: "not-signed-in",
      });
    });
  });

  it.each([
    ["Pegawai UPK", ["upk_staff"]],
    ["Kepala Unit", ["head_of_unit"]],
    ["Direktur", ["director"]],
    ["Ketua Program Studi", ["head_of_program"]],
    ["Pengasuh", ["mentor"]],
    ["Penilai Mahasiswa", ["assessor"]],
    ["BAM - BPHK", ["bam_bphk"]],
  ] as const)(
    "refuses %s, even with the exact address and the student's own record",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { store, student, attendanceId } = await addRecords(db);

        const opened = await openAttendancePhoto(
          db,
          store,
          { ...student, roles },
          attendanceId,
        );

        expect(opened).toEqual({ ok: false, refusal: "not-allowed" });
      });
    },
  );

  it("refuses another student, as if the photo did not exist", async () => {
    await inTestDatabase(async (db) => {
      const { store, programId, attendanceId } = await addRecords(db);
      const other = await addTestStudentAccount(db, programId, {
        nim: "9972500002",
        name: "Mahasiswa Uji Lain Buka",
        cohortYear: 2189,
      });

      const opened = await openAttendancePhoto(db, store, other, attendanceId);

      expect(opened).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("does not open the photo of a removed schedule: its attendance is no longer shown", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db
        .update(activitySchedules)
        .set({ deletedAt: WHILE_OPEN, deletedBy: records.staffId })
        .where(eq(activitySchedules.id, records.scheduleId));

      const opened = await openAttendancePhoto(
        db,
        records.store,
        records.student,
        records.attendanceId,
      );

      expect(opened).toEqual({ ok: false, refusal: "not-found" });
      expect(await db.select().from(activityAttendances)).toHaveLength(1);
    });
  });

  it("finds nothing for an unknown or malformed key, for an attendance without a photo, and where file keeping is off", async () => {
    await inTestDatabase(async (db) => {
      const { store, student, staffId, scheduleId, attendanceId } =
        await addRecords(db);
      const noPhoto = await addTestAttendance(db, staffId, {
        scheduleId,
        studentId: student.studentId,
        status: "dispensation",
        sentAt: null,
      });
      const notFound = { ok: false, refusal: "not-found" };
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const id of [unknown, "bukan-kunci", "", noPhoto]) {
        expect(await openAttendancePhoto(db, store, student, id)).toEqual(
          notFound,
        );
      }
      expect(
        await openAttendancePhoto(db, null, student, attendanceId),
      ).toEqual(notFound);
    });
  });

  it("says to try again when the file storage cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const { student, attendanceId } = await addRecords(db);

      const opened = await openAttendancePhoto(
        db,
        unreachableStore(),
        student,
        attendanceId,
      );

      expect(opened).toEqual({ ok: false, refusal: "unreachable" });
    });
  });
});
