import { afterEach, describe, expect, it } from "vitest";
import {
  academicPeriods,
  accounts,
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { PHOTO_FILE_NAME } from "./attendance-photo";
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
 * Two sends at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("kirimfoto");

afterEach(async () => {
  await own.db.delete(activityAttendances);
  await own.db.delete(activitySchedules);
  await own.db.delete(ppksActivities);
  await own.db.delete(academicPeriods);
  await own.db.delete(accounts);
  await own.db.delete(students);
});

describe("Kirim presensi pressed twice at the same moment", () => {
  it("keeps one photo and one attendance: the second press waits for the first, then finds its photo kept", async () => {
    const staff = await addTestActor(own.db, "Pegawai Dua Kali Foto", [
      "upk_staff",
    ]);
    const activityId = await addTestActivity(own.db, staff.id);
    const periods = await addTestPeriods(own.db, 2180);
    const programId = await addTestProgram(own.db, "UJIFOTODUAKALI");
    const student = await addTestStudentAccount(own.db, programId, {
      nim: "9972400001",
      name: "Mahasiswa Dua Kali Foto",
      cohortYear: 2179,
    });
    const scheduleId = await addTestSchedule(own.db, {
      activityId,
      academicPeriodId: periods.oddId,
      changedBy: staff.id,
      startsOn: "2180-10-13",
    });
    const store = memoryStore();
    const at = new Date("2180-10-13T03:00:00Z");
    const photo = { name: PHOTO_FILE_NAME, bytes: testPhoto() };

    const both = await own.atOnce(
      (db) => sendAttendancePhoto(db, store, student, scheduleId, photo, at),
      (db) => sendAttendancePhoto(db, store, student, scheduleId, photo, at),
    );

    const sent = {
      ok: true,
      value: "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.",
    };
    expect(both.sooner).toEqual(sent);
    expect(both.later).toEqual(sent);
    const kept = await own.db.select().from(activityAttendances);
    expect(kept).toHaveLength(1);
    expect([...store.files.keys()]).toEqual([kept[0]?.photoKey]);
  });
});
