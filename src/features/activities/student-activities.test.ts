// Sample Tahun akademik of this file: 2360 to 2361.
import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  readStudentActivities,
  type StudentActivities,
} from "./student-activities";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2360 and 2361, the
 * program UJIKEGIATANMHS and the NIMs 9972100000 to 9972100099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "2361-10-13";
/** Ten in the morning on campus. */
const NOW = new Date("2361-10-13T03:00:00Z");

interface Records {
  staffId: string;
  /** An activity of semester 3, which the student is in during Ganjil 2361. */
  activityId: string;
  /** Ganjil 2361/2161, which runs today. */
  periodId: string;
  programId: number;
  /** A student of angkatan 2360. */
  student: TestStudentAccount;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Kegiatan Mhs", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2361);
  const programId = await addTestProgram(db, "UJIKEGIATANMHS");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972100001",
    name: "Mahasiswa Uji Kegiatan",
    cohortYear: 2360,
  });
  return {
    staffId: staff.id,
    activityId,
    periodId: periods.oddId,
    programId,
    student,
  };
}

/** A schedule of one morning, a number of days from today. */
function scheduleIn(records: Records, days: number) {
  return {
    activityId: records.activityId,
    academicPeriodId: records.periodId,
    changedBy: records.staffId,
    startsOn: daysAfter(TODAY, days),
  };
}

async function shownTo(
  db: Database,
  account: TestStudentAccount,
  page = 1,
  keepsFiles = true,
): Promise<StudentActivities> {
  const answer = await readStudentActivities(
    db,
    account,
    NOW,
    page,
    keepsFiles,
  );
  if (answer.kind !== "found") throw new Error("The student was refused.");
  return answer.activities;
}

function idsOf(schedules: { id: string }[]): string[] {
  return schedules.map((schedule) => schedule.id);
}

describe("readStudentActivities", () => {
  it("refuses an account without the right, and a student account with no student record", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const staff = {
        ...records.student,
        roles: ["upk_staff", "head_of_unit"] as const,
      };
      const nobody = { ...records.student, studentId: null };

      expect(await readStudentActivities(db, staff, NOW, 1, true)).toEqual({
        kind: "refused",
      });
      expect(await readStudentActivities(db, nobody, NOW, 1, true)).toEqual({
        kind: "refused",
      });
    });
  });

  it("shows as running the schedules that wait for their hour today or still take photos", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const open = await addTestSchedule(db, scheduleIn(records, 0));
      const laterToday = await addTestSchedule(db, {
        ...scheduleIn(records, 0),
        startTime: "13:00",
        endTime: "15:00",
      });
      const stillOpen = await addTestSchedule(db, {
        ...scheduleIn(records, -3),
        uploadUnit: "week",
      });
      await addTestSchedule(db, scheduleIn(records, -3));
      await addTestSchedule(db, scheduleIn(records, 1));

      const { current, semester } = await shownTo(db, records.student);

      expect(idsOf(current).sort()).toEqual(
        [open, laterToday, stillOpen].sort(),
      );
      expect(semester).toBe(3);
    });
  });

  it("shows only schedules meant for the student: not a removed one, not one of another semester, not one of their semester in another period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const earlier = await addTestPeriods(db, 2360);
      const firstSemester = await addTestActivity(db, records.staffId, {
        semester: 1,
        name: "Kegiatan uji semester satu",
      });
      const own = await addTestSchedule(db, scheduleIn(records, 0));
      await addTestSchedule(db, {
        ...scheduleIn(records, 0),
        deletedAt: NOW,
        deletedBy: records.staffId,
      });
      await addTestSchedule(db, {
        ...scheduleIn(records, 0),
        activityId: firstSemester,
      });
      const asFirstYear = await addTestSchedule(db, {
        ...scheduleIn(records, -380),
        activityId: firstSemester,
        academicPeriodId: earlier.oddId,
      });
      await addTestSchedule(db, {
        ...scheduleIn(records, -380),
        academicPeriodId: earlier.oddId,
      });

      const shown = await shownTo(db, records.student);

      expect(idsOf(shown.current)).toEqual([own]);
      expect(idsOf(shown.history.schedules)).toEqual([asFirstYear]);
      expect(shown.coming).toEqual([]);
    });
  });

  it("shows the next five schedules, the earliest first", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const added: string[] = [];
      for (const days of [6, 5, 4, 3, 2, 1]) {
        added.push(await addTestSchedule(db, scheduleIn(records, days)));
      }

      const { coming } = await shownTo(db, records.student);

      expect(idsOf(coming)).toEqual(added.reverse().slice(0, 5));
    });
  });

  it("shows the history 20 a page, the newest first, and the last page when asked for one beyond it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const added: string[] = [];
      for (let days = 1; days <= 21; days += 1) {
        added.push(await addTestSchedule(db, scheduleIn(records, -days)));
      }

      const first = await shownTo(db, records.student, 1);
      const beyond = await shownTo(db, records.student, 9);

      expect(idsOf(first.history.schedules)).toEqual(added.slice(0, 20));
      expect(first.history).toMatchObject({ matching: 21, page: 1 });
      expect(idsOf(beyond.history.schedules)).toEqual(added.slice(20));
      expect(beyond.history).toMatchObject({ matching: 21, page: 2 });
    });
  });

  it("shows the student their own newest clarification for a schedule of the history, and never another student's", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staffId, student } = records;
      const { studentId } = student;
      const other = await addTestStudentAccount(db, records.programId, {
        nim: "9972100003",
        name: "Mahasiswa Uji Lain Klar",
        cohortYear: 2360,
      });
      const askedAgain = await addTestSchedule(db, scheduleIn(records, -5));
      const othersOnly = await addTestSchedule(db, scheduleIn(records, -6));
      await addTestClarification(db, staffId, {
        scheduleId: askedAgain,
        studentId,
        status: "rejected",
        note: "Surat tidak terbaca.",
        sentAt: new Date("2361-10-10T03:00:00Z"),
      });
      await addTestClarification(db, staffId, {
        scheduleId: askedAgain,
        studentId,
        status: "submitted",
        sentAt: new Date("2361-10-11T03:00:00Z"),
      });
      await addTestClarification(db, staffId, {
        scheduleId: othersOnly,
        studentId: other.studentId,
        status: "accepted",
      });

      const { clarifications } = await shownTo(db, student);

      expect(clarifications).toEqual({
        [askedAgain]: { status: "submitted", note: "", file: null },
      });
    });
  });

  it("names the file of the student's newest clarification where it is kept, and none where no file is kept or this place has no file storage", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staffId, student } = records;
      const { studentId } = student;
      const withFile = await addTestSchedule(db, scheduleIn(records, -5));
      const withoutFile = await addTestSchedule(db, scheduleIn(records, -6));
      await addTestClarification(db, staffId, {
        scheduleId: withFile,
        studentId,
        status: "rejected",
        fileKey: "attendance-clarifications/uji-riwayat-lama.pdf",
        fileName: "surat-lama.pdf",
        sentAt: new Date("2361-10-10T03:00:00Z"),
      });
      const newest = await addTestClarification(db, staffId, {
        scheduleId: withFile,
        studentId,
        status: "submitted",
        fileKey: "attendance-clarifications/uji-riwayat-baru.pdf",
        fileName: "surat-baru.pdf",
        sentAt: new Date("2361-10-11T03:00:00Z"),
      });
      await addTestClarification(db, staffId, {
        scheduleId: withoutFile,
        studentId,
        status: "accepted",
      });

      const kept = await shownTo(db, student);
      const notKept = await shownTo(db, student, 1, false);

      expect(kept.clarifications).toEqual({
        [withFile]: {
          status: "submitted",
          note: "",
          file: { clarificationId: newest, name: "surat-baru.pdf" },
        },
        [withoutFile]: { status: "accepted", note: "", file: null },
      });
      expect(notKept.clarifications[withFile]?.file).toBeNull();
    });
  });

  it("shows the student their own newest attendance, and never another student's", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staffId, student } = records;
      const other = await addTestStudentAccount(db, records.programId, {
        nim: "9972100002",
        name: "Mahasiswa Uji Lain",
        cohortYear: 2360,
      });
      const resent = await addTestSchedule(db, scheduleIn(records, -1));
      const notSent = await addTestSchedule(db, scheduleIn(records, -2));
      await addTestAttendance(db, staffId, {
        scheduleId: resent,
        studentId: student.studentId,
        status: "rejected",
        note: "Foto buram",
        sentAt: new Date("2361-10-12T05:00:00Z"),
      });
      await addTestAttendance(db, staffId, {
        scheduleId: resent,
        studentId: student.studentId,
        status: "waiting",
        sentAt: new Date("2361-10-12T06:00:00Z"),
      });
      await addTestAttendance(db, staffId, {
        scheduleId: notSent,
        studentId: other.studentId,
        status: "valid",
      });

      const { history } = await shownTo(db, student);

      expect(history.schedules.map(({ attendance }) => attendance)).toEqual([
        {
          status: "waiting",
          note: "",
          sentAt: new Date("2361-10-12T06:00:00Z"),
        },
        null,
      ]);
    });
  });

  it("counts the numbers over the running period only, without a removed schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staffId, student } = records;
      const earlier = await addTestPeriods(db, 2360);
      const firstSemester = await addTestActivity(db, staffId, {
        semester: 1,
        name: "Kegiatan uji semester satu",
      });
      const attend = (scheduleId: string, status: "valid" | "waiting") =>
        addTestAttendance(db, staffId, {
          scheduleId,
          studentId: student.studentId,
          status,
        });
      const attended = await addTestSchedule(db, scheduleIn(records, -10));
      await addTestSchedule(db, scheduleIn(records, -9));
      const waiting = await addTestSchedule(db, scheduleIn(records, -8));
      const excused = await addTestSchedule(db, scheduleIn(records, -7));
      const removed = await addTestSchedule(db, {
        ...scheduleIn(records, -6),
        deletedAt: NOW,
        deletedBy: staffId,
      });
      const lastYear = await addTestSchedule(db, {
        ...scheduleIn(records, -380),
        activityId: firstSemester,
        academicPeriodId: earlier.oddId,
      });
      await attend(attended, "valid");
      await attend(waiting, "waiting");
      await attend(removed, "valid");
      await attend(lastYear, "valid");
      await addTestAttendance(db, staffId, {
        scheduleId: excused,
        studentId: student.studentId,
        status: "dispensation",
        sentAt: null,
      });

      const shown = await shownTo(db, student);

      expect(shown.score).toEqual({ attended: 1, counted: 3 });
      expect(shown.waiting).toBe(1);
      expect(shown.dispensations).toBe(1);
    });
  });

  it("shows a student who is not Aktif no activity: they take part in none", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const onLeave = await addTestStudentAccount(db, records.programId, {
        nim: "9972100003",
        name: "Mahasiswa Uji Cuti",
        cohortYear: 2360,
        status: "on_leave",
      });
      await addTestSchedule(db, scheduleIn(records, 0));
      await addTestSchedule(db, scheduleIn(records, -5));
      await addTestSchedule(db, scheduleIn(records, 5));

      const shown = await shownTo(db, onLeave);

      expect(shown.current).toEqual([]);
      expect(shown.coming).toEqual([]);
      expect(shown.history.matching).toBe(0);
      expect(shown.score).toEqual({ attended: 0, counted: 0 });
    });
  });
});
