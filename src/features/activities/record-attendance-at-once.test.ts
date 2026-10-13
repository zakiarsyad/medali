import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { activityAttendanceChanges, activityAttendances } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { PHOTO_FILE_NAME } from "./attendance-photo";
import { recordAttendance } from "./record-attendance";
import { sendAttendancePhoto } from "./send-attendance-photo";
import { testPhoto } from "./test-photo";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";

/*
 * A record made by hand and a photo sent at the same moment need two
 * connections that both see the saved rows, and the log of decisions
 * cannot be emptied. So these checks have a database of their own,
 * dropped at the end, and each check uses records of its own: the Tahun
 * akademik 2280 and 2290, and the NIMs 9973400000 to 9973400099.
 */
const own = withOwnTestDatabase("catatbareng");

const PHOTO = { name: PHOTO_FILE_NAME, bytes: testPhoto() };

/** A student with nothing sent for a schedule that takes photos at `at`. */
async function addRecords(year: number, program: string, nim: string) {
  const staff = await addTestActor(own.db, `Pegawai ${program}`, ["upk_staff"]);
  const activityId = await addTestActivity(own.db, staff.id);
  const periods = await addTestPeriods(own.db, year);
  const programId = await addTestProgram(own.db, program);
  const student = await addTestStudentAccount(own.db, programId, {
    nim,
    name: `Mahasiswa ${program}`,
    cohortYear: year - 1,
  });
  const scheduleId = await addTestSchedule(own.db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: `${year}-10-13`,
  });
  const account: AccountForAccess = {
    id: staff.id,
    roles: ["upk_staff"],
    studyProgramId: null,
    studentId: null,
  };
  const dispensation = {
    studentId: student.studentId,
    scheduleId,
    kind: "sick",
    note: "Surat dokter contoh",
    replaces: null,
  };
  return {
    staff: account,
    student,
    scheduleId,
    dispensation,
    at: new Date(`${year}-10-13T03:00:00Z`),
  };
}

function keptFor(scheduleId: string) {
  return own.db
    .select()
    .from(activityAttendances)
    .where(eq(activityAttendances.scheduleId, scheduleId));
}

describe("a dispensation recorded by hand and a photo sent at the same moment", () => {
  it("keeps the dispensation alone when it comes first: the photo waits, then is not kept, as for any student whose attendance was decided", async () => {
    const records = await addRecords(2280, "UJICATATBARENG", "9973400001");
    const { staff, student, scheduleId, dispensation, at } = records;
    const store = memoryStore();

    const both = await own.atOnce<unknown>(
      (db) => recordAttendance(db, staff, dispensation, at),
      (db) => sendAttendancePhoto(db, store, student, scheduleId, PHOTO, at),
    );

    expect(both.sooner).toMatchObject({
      state: { done: "Kehadiran Mahasiswa UJICATATBARENG dicatat." },
    });
    expect(both.later).toEqual({
      ok: false,
      error:
        "Kehadiran Anda pada kegiatan ini sudah diperiksa, sehingga foto baru tidak disimpan.",
    });
    const kept = await keptFor(scheduleId);
    expect(kept.map(({ status }) => status)).toEqual(["dispensation"]);
    expect([...store.files.keys()]).toEqual([]);
  });

  it("keeps the photo alone when it comes first: the record waits, then asks to confirm the status it finds, and writes no line", async () => {
    const records = await addRecords(2290, "UJICATATBARENGDUA", "9973400002");
    const { staff, student, scheduleId, dispensation, at } = records;
    const store = memoryStore();

    const both = await own.atOnce<unknown>(
      (db) => sendAttendancePhoto(db, store, student, scheduleId, PHOTO, at),
      (db) => recordAttendance(db, staff, dispensation, at),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.",
    });
    expect(both.later).toEqual({
      state: {
        error:
          "Mahasiswa UJICATATBARENGDUA sudah berstatus Menunggu verifikasi pada kegiatan ini. Tekan Simpan lagi untuk menggantinya.",
        done: null,
      },
      confirm: "waiting",
    });
    const kept = await keptFor(scheduleId);
    expect(kept.map(({ status }) => status)).toEqual(["waiting"]);
    const lines = await own.db.select().from(activityAttendanceChanges);
    expect(
      lines.filter(({ attendanceId }) => attendanceId === kept[0]?.id),
    ).toEqual([]);
  });
});
