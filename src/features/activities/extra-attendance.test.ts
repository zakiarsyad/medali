// Sample Tahun akademik of this file: 2760 to 2760.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activityClarifications,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore } from "@/files/memory-store";
import { readAttendanceCounts } from "./attendance-counts";
import { readAttendanceNumbers } from "./attendance-numbers";
import { PHOTO_FILE_NAME } from "./attendance-photo";
import type { ParticipantChoice } from "./chosen-participants";
import { readCohortCounts } from "./cohort-counts";
import { listSchedules } from "./list-schedules";
import { readMeanScore } from "./read-mean-score";
import { readRecordActivities } from "./record-activities";
import { replaceParticipants } from "./save-participants";
import { NOT_OWN_ACTIVITY, sendAttendancePhoto } from "./send-attendance-photo";
import { sendClarification } from "./send-clarification";
import { readStudentActivities } from "./student-activities";
import { testPaper } from "./test-paper";
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
import { readVerification } from "./verification";

/*
 * This file's own sample values: the Tahun akademik 2760, the program
 * UJIHADIRTAMBAH, the classes HT-01 and HT-02 and the NIMs 9974670000 to
 * 9974670099.
 */

const inTestDatabase = withTestDatabase();

/** Ten in the morning on campus, on the day of the schedule. */
const WHILE_OPEN = new Date("2760-10-13T03:00:00Z");
/** Two days after the upload of the schedule closed. */
const AFTER_UPLOAD = new Date("2760-10-16T03:00:00Z");
const DAY_AFTER_UPLOAD = "2760-10-16";
const PHOTO = { name: PHOTO_FILE_NAME, bytes: testPhoto() };

interface Records {
  staffId: string;
  programId: number;
  oddId: string;
  evenId: string;
  activityId: string;
  /** In HT-01, which the schedule names. */
  chosen: TestStudentAccount;
  /** In HT-02, which it does not name; of the same angkatan. */
  other: TestStudentAccount;
  /**
   * A required schedule for HT-01 on the morning of 13 October 2760,
   * which takes photos until the end of 14 October.
   */
  scheduleId: string;
}

const FOR_FIRST_CLASS: ParticipantChoice = {
  kind: "classes",
  classNames: ["HT-01"],
};

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Hadir Tambah", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id, {
    semester: null,
    name: "Kegiatan tambahan uji hadir",
  });
  const periods = await addTestPeriods(db, 2760);
  const programId = await addTestProgram(db, "UJIHADIRTAMBAH");
  const chosen = await addTestStudentAccount(db, programId, {
    nim: "9974670001",
    name: "Mahasiswa Uji Hadir Terpilih",
    cohortYear: 2759,
    className: "HT-01",
  });
  const other = await addTestStudentAccount(db, programId, {
    nim: "9974670002",
    name: "Mahasiswa Uji Hadir Lain",
    cohortYear: 2759,
    className: "HT-02",
  });
  const scheduleId = await addExtra(db, {
    staffId: staff.id,
    activityId,
    periodId: periods.oddId,
    startsOn: "2760-10-13",
  });
  return {
    staffId: staff.id,
    programId,
    oddId: periods.oddId,
    evenId: periods.evenId,
    activityId,
    chosen,
    other,
    scheduleId,
  };
}

async function addExtra(
  db: Database,
  parts: {
    staffId: string;
    activityId: string;
    periodId: string;
    startsOn: string;
    isRequired?: boolean;
  },
): Promise<string> {
  const scheduleId = await addTestSchedule(db, {
    activityId: parts.activityId,
    academicPeriodId: parts.periodId,
    changedBy: parts.staffId,
    startsOn: parts.startsOn,
    isRequired: parts.isRequired ?? true,
  });
  await replaceParticipants(db, scheduleId, FOR_FIRST_CLASS);
  return scheduleId;
}

function idsOf(schedules: readonly { id: string }[]): string[] {
  return schedules.map((schedule) => schedule.id);
}

async function activitiesOf(
  db: Database,
  student: TestStudentAccount,
  at: Date,
) {
  const answer = await readStudentActivities(db, student, at, 1, true);
  if (answer.kind !== "found") throw new Error("The student was refused.");
  return answer.activities;
}

/** The students of this file only, as a page limits them. */
function ofProgram(records: Records) {
  return eq(students.studyProgramId, records.programId);
}

describe("a chosen student and a schedule of an extra activity", () => {
  it("shows it among their current activities, and then in their history", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const today = await activitiesOf(db, records.chosen, WHILE_OPEN);
      const later = await activitiesOf(db, records.chosen, AFTER_UPLOAD);

      expect(idsOf(today.current)).toEqual([records.scheduleId]);
      expect(idsOf(later.history.schedules)).toEqual([records.scheduleId]);
    });
  });

  it("shows it among their coming activities before it starts", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const before = await activitiesOf(
        db,
        records.chosen,
        new Date("2760-10-10T03:00:00Z"),
      );

      expect(idsOf(before.coming)).toEqual([records.scheduleId]);
    });
  });

  it("does not show it to a student it does not name", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const today = await activitiesOf(db, records.other, WHILE_OPEN);
      const later = await activitiesOf(db, records.other, AFTER_UPLOAD);

      expect(today.current).toEqual([]);
      expect(later.history.schedules).toEqual([]);
    });
  });

  it("does not show it to a chosen student who is no longer Aktif", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.id, records.chosen.studentId));

      const today = await activitiesOf(db, records.chosen, WHILE_OPEN);

      expect(today.current).toEqual([]);
    });
  });
});

describe("a photo for a schedule of an extra activity", () => {
  it("is kept for a chosen student, and shows in Verifikasi presensi", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const sent = await sendAttendancePhoto(
        db,
        memoryStore(),
        records.chosen,
        records.scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent.ok).toBe(true);
      const staff = {
        id: records.staffId,
        roles: ["upk_staff"] as const,
        studyProgramId: null,
        studentId: null,
      };
      const answer = await readVerification(
        db,
        staff,
        { filters: { scheduleId: records.scheduleId, status: "all" }, page: 1 },
        WHILE_OPEN,
        true,
      );
      if (answer.kind !== "found") throw new Error("The staff was refused.");
      expect(answer.verification.list.cards).toMatchObject([
        {
          name: "Mahasiswa Uji Hadir Terpilih",
          activity: "Kegiatan tambahan uji hadir",
          status: "waiting",
        },
      ]);
      const choices = answer.verification.choices.map((choice) => choice.id);
      expect(choices).toContain(records.scheduleId);
    });
  });

  it("is refused by the server for a student it does not name, and nothing is kept", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      const sent = await sendAttendancePhoto(
        db,
        store,
        records.other,
        records.scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent).toEqual(NOT_OWN_ACTIVITY);
      expect(await db.select().from(activityAttendances)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });
});

describe("a clarification for a schedule of an extra activity", () => {
  function sentFor(scheduleId: string) {
    return {
      scheduleId,
      reason: "technical_trouble",
      explanation: "Aplikasi gagal mengunggah swafoto di lokasi kegiatan.",
      file: { name: "surat-keterangan.pdf", bytes: testPaper() },
    };
  }

  it("is kept for a chosen student who sent nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const sent = await sendClarification(
        db,
        memoryStore(),
        records.chosen,
        sentFor(records.scheduleId),
        AFTER_UPLOAD,
      );

      expect(sent).toEqual({ ok: true, value: "Klarifikasi terkirim." });
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
    });
  });

  it("is refused for a student it does not name", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const sent = await sendClarification(
        db,
        memoryStore(),
        records.other,
        sentFor(records.scheduleId),
        AFTER_UPLOAD,
      );

      expect(sent).toEqual(NOT_OWN_ACTIVITY);
      expect(await db.select().from(activityClarifications)).toEqual([]);
    });
  });
});

describe("Nilai kehadiran and a schedule of an extra activity", () => {
  it("counts a required one for the students it names, in the period it keeps only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // Missed, but of the next period: it does not count now.
      await addExtra(db, {
        staffId: records.staffId,
        activityId: records.activityId,
        periodId: records.evenId,
        startsOn: "2761-03-10",
      });
      await addTestAttendance(db, records.staffId, {
        scheduleId: records.scheduleId,
        studentId: records.chosen.studentId,
        status: "valid",
      });

      const mean = await readMeanScore(
        db,
        ofProgram(records),
        DAY_AFTER_UPLOAD,
      );
      const own = await activitiesOf(db, records.chosen, AFTER_UPLOAD);

      expect(mean).toEqual({ percent: 100, students: 1 });
      expect(own.score).toEqual({ attended: 1, counted: 1 });
    });
  });

  it("leaves out one that is not required (tidak wajib)", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addExtra(db, {
        staffId: records.staffId,
        activityId: records.activityId,
        periodId: records.oddId,
        startsOn: "2760-10-12",
        isRequired: false,
      });
      await addTestAttendance(db, records.staffId, {
        scheduleId: records.scheduleId,
        studentId: records.chosen.studentId,
        status: "valid",
      });

      const mean = await readMeanScore(
        db,
        ofProgram(records),
        DAY_AFTER_UPLOAD,
      );
      const own = await activitiesOf(db, records.chosen, AFTER_UPLOAD);

      expect(mean).toEqual({ percent: 100, students: 1 });
      expect(own.score).toEqual({ attended: 1, counted: 1 });
    });
  });
});

describe("a record made by hand for a schedule of an extra activity", () => {
  it("offers it for a chosen student only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const staff = {
        id: records.staffId,
        roles: ["upk_staff"] as const,
        studyProgramId: null,
        studentId: null,
      };

      const forChosen = await readRecordActivities(
        db,
        staff,
        records.chosen.studentId,
        WHILE_OPEN,
      );
      const forOther = await readRecordActivities(
        db,
        staff,
        records.other.studentId,
        WHILE_OPEN,
      );

      expect(idsOf(forChosen)).toEqual([records.scheduleId]);
      expect(forOther).toEqual([]);
    });
  });
});

describe("participants changed after photos came in", () => {
  it("keeps the photos of a student taken out, valid or waiting, and no longer counts them", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();
      await sendAttendancePhoto(
        db,
        store,
        records.chosen,
        records.scheduleId,
        PHOTO,
        WHILE_OPEN,
      );
      await db.update(activityAttendances).set({
        status: "valid",
        decidedAt: WHILE_OPEN,
        decidedBy: records.staffId,
      });
      const waitingId = await addExtra(db, {
        staffId: records.staffId,
        activityId: records.activityId,
        periodId: records.oddId,
        startsOn: "2760-10-13",
      });
      await sendAttendancePhoto(
        db,
        store,
        records.chosen,
        waitingId,
        PHOTO,
        WHILE_OPEN,
      );

      for (const scheduleId of [records.scheduleId, waitingId]) {
        await replaceParticipants(db, scheduleId, {
          kind: "classes",
          classNames: ["HT-02"],
        });
      }

      const kept = await db
        .select({
          studentId: activityAttendances.studentId,
          status: activityAttendances.status,
        })
        .from(activityAttendances);
      expect(kept).toHaveLength(2);
      expect(kept).toEqual(
        expect.arrayContaining([
          { studentId: records.chosen.studentId, status: "valid" },
          { studentId: records.chosen.studentId, status: "waiting" },
        ]),
      );
      const numbers = await readAttendanceNumbers(
        db,
        ofProgram(records),
        { kind: "extra" },
        DAY_AFTER_UPLOAD,
      );
      expect(numbers.waiting).toBe(0);
      const list = await listSchedules(db, { kind: "extra" }, 1);
      const shown = list.schedules.filter(
        (schedule) => schedule.id === records.scheduleId,
      );
      const counts = await readAttendanceCounts(
        db,
        ofProgram(records),
        shown,
        await readCohortCounts(db),
        DAY_AFTER_UPLOAD,
      );
      expect(counts[records.scheduleId]).toEqual({
        targeted: 1,
        present: 0,
        waiting: 0,
        dispensations: 0,
      });
      const mean = await readMeanScore(
        db,
        ofProgram(records),
        DAY_AFTER_UPLOAD,
      );
      expect(mean).toEqual({ percent: 0, students: 1 });
      const own = await activitiesOf(db, records.chosen, AFTER_UPLOAD);
      expect(own.history.schedules).toEqual([]);
      expect(own.score).toEqual({ attended: 0, counted: 0 });
    });
  });
});
