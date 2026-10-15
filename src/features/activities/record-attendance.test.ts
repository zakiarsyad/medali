// Sample Tahun akademik of this file: 2250 to 2250.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  activityAttendanceChanges,
  activityAttendances,
  activitySchedules,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { scorePercent } from "./attendance-score";
import type { SentRecord } from "./manual-record";
import { recordAttendance } from "./record-attendance";
import { readStudentActivities } from "./student-activities";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  TEST_SENT_AT,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2250, the program
 * UJICATATMANUAL and the NIMs 9973100000 to 9973100099.
 */

const inTestDatabase = withTestDatabase();

/** Ten days after the schedule, so its upload time has closed. */
const AT = new Date("2250-09-20T03:00:00Z");
const NAME = "Mahasiswa Uji Catat";

interface Records {
  staff: AccountForAccess;
  activityId: string;
  periodId: string;
  /** A required schedule of 10 September 2250, meant for the student. */
  scheduleId: string;
  /** A student of angkatan 2249, in semester 3 during Ganjil 2250. */
  student: TestStudentAccount;
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Catat", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2250);
  const programId = await addTestProgram(db, "UJICATATMANUAL");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973100001",
    name: NAME,
    cohortYear: 2249,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2250-09-10",
  });
  return {
    staff: accountOf(staff.id, staff.roles),
    activityId,
    periodId: periods.oddId,
    scheduleId,
    student,
  };
}

function sent(records: Records, more: Partial<SentRecord> = {}): SentRecord {
  return {
    studentId: records.student.studentId,
    scheduleId: records.scheduleId,
    kind: "present",
    note: "",
    replaces: null,
    ...more,
  };
}

function record(db: Database, records: Records, more?: Partial<SentRecord>) {
  return recordAttendance(db, records.staff, sent(records, more), AT);
}

function stored(db: Database) {
  return db.select().from(activityAttendances);
}

function logLines(db: Database) {
  return db.select().from(activityAttendanceChanges);
}

function refusal(error: string) {
  return { state: { error, done: null }, confirm: null };
}

async function scoreOf(db: Database, student: TestStudentAccount) {
  const answer = await readStudentActivities(db, student, AT, 1, true);
  if (answer.kind !== "found") throw new Error("The student was refused.");
  return answer.activities;
}

describe("recordAttendance", () => {
  it('records Hadir for a student with nothing sent: a valid attendance without a photo or a time sent, and "Kehadiran (name) dicatat."', async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const answer = await record(db, records, { note: " Ponsel rusak " });

      expect(answer).toEqual({
        state: { error: null, done: `Kehadiran ${NAME} dicatat.` },
        confirm: null,
      });
      expect(await stored(db)).toEqual([
        expect.objectContaining({
          scheduleId: records.scheduleId,
          studentId: records.student.studentId,
          status: "valid",
          note: "Dicatat manual. Ponsel rusak",
          photoKey: null,
          sentAt: null,
          decidedAt: AT,
          decidedBy: records.staff.id,
        }),
      ]);
    });
  });

  it("writes a line into the log in the same save: who, when, nothing before, and the record after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await record(db, records, { kind: "sick", note: "Surat dokter 12" });

      const [kept] = await stored(db);
      expect(await logLines(db)).toEqual([
        expect.objectContaining({
          attendanceId: kept?.id,
          changedBy: records.staff.id,
          changedAt: AT,
          statusBefore: null,
          noteBefore: null,
          statusAfter: "dispensation",
          noteAfter: "Sakit. Surat dokter 12",
        }),
      ]);
    });
  });

  it.each(["leave", "sick"] as const)(
    'does not save a dispensation (%s) without a Keterangan: "Isi keterangan dispensasi."',
    async (kind) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        const answer = await record(db, records, { kind, note: "  " });

        expect(answer).toEqual(refusal("Isi keterangan dispensasi."));
        expect(await stored(db)).toEqual([]);
        expect(await logLines(db)).toEqual([]);
      });
    },
  );

  it("leaves a dispensation out of Nilai kehadiran, where the missed activity counted before", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const before = await scoreOf(db, records.student);

      await record(db, records, { kind: "leave", note: "Surat izin 7" });

      const after = await scoreOf(db, records.student);
      expect(before.score.activities).toEqual({ attended: 0, counted: 1 });
      expect(scorePercent(before.score.activities)).toBe(0);
      expect(after.score.activities).toEqual({ attended: 0, counted: 0 });
      expect(scorePercent(after.score.activities)).toBeNull();
      expect(after.dispensations).toBe(1);
    });
  });

  it("counts Hadir recorded by hand as attended in Nilai kehadiran", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await record(db, records);

      const { score } = await scoreOf(db, records.student);
      expect(score.activities).toEqual({ attended: 1, counted: 1 });
    });
  });

  it("saves nothing while the student already has a status, and says which; a second Simpan replaces it and keeps the photo", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const attendanceId = await addTestAttendance(db, records.staff.id, {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
        status: "waiting",
        photoKey: "attendance-photos/uji-catat",
      });
      const dispensation = { kind: "leave", note: "Surat izin 7" };

      const asked = await record(db, records, dispensation);

      expect(asked).toEqual({
        state: {
          error: `${NAME} sudah berstatus Menunggu verifikasi pada kegiatan ini. Tekan Simpan lagi untuk menggantinya.`,
          done: null,
        },
        confirm: "waiting",
      });
      expect(await stored(db)).toEqual([
        expect.objectContaining({ status: "waiting", decidedBy: null }),
      ]);
      expect(await logLines(db)).toEqual([]);

      const saved = await record(db, records, {
        ...dispensation,
        replaces: asked.confirm,
      });

      expect(saved.state.done).toBe(`Kehadiran ${NAME} dicatat.`);
      expect(await stored(db)).toEqual([
        expect.objectContaining({
          id: attendanceId,
          status: "dispensation",
          note: "Izin. Surat izin 7",
          photoKey: "attendance-photos/uji-catat",
          sentAt: TEST_SENT_AT,
          decidedBy: records.staff.id,
        }),
      ]);
      expect(await logLines(db)).toEqual([
        expect.objectContaining({
          attendanceId,
          statusBefore: "waiting",
          noteBefore: "",
          statusAfter: "dispensation",
          noteAfter: "Izin. Surat izin 7",
        }),
      ]);
    });
  });

  it("asks again when the status changed since the person agreed to replace it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestAttendance(db, records.staff.id, {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
      });

      const answer = await record(db, records, { replaces: "waiting" });

      expect(answer).toEqual({
        state: {
          error: `${NAME} sudah berstatus Ditolak pada kegiatan ini. Tekan Simpan lagi untuk menggantinya.`,
          done: null,
        },
        confirm: "rejected",
      });
      expect(await stored(db)).toEqual([
        expect.objectContaining({ status: "rejected" }),
      ]);
      expect(await logLines(db)).toEqual([]);
    });
  });

  it("replaces the newest attendance of the student for the schedule, and leaves an older rejected photo as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const target = {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
      };
      const olderId = await addTestAttendance(db, records.staff.id, {
        ...target,
        status: "rejected",
        sentAt: new Date("2250-09-10T03:00:00Z"),
      });
      const newerId = await addTestAttendance(db, records.staff.id, {
        ...target,
        status: "waiting",
        sentAt: new Date("2250-09-10T05:00:00Z"),
      });

      const answer = await record(db, records, { replaces: "waiting" });

      expect(answer.state.done).toBe(`Kehadiran ${NAME} dicatat.`);
      const kept = await stored(db);
      expect(kept.find(({ id }) => id === olderId)?.status).toBe("rejected");
      expect(kept.find(({ id }) => id === newerId)).toMatchObject({
        status: "valid",
        note: "Dicatat manual.",
      });
    });
  });

  it("saves nothing and says to press again when the database's rule of one waiting or valid attendance refuses the record", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const target = {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
      };
      // As when a valid attendance appears beside the one being replaced.
      await addTestAttendance(db, records.staff.id, {
        ...target,
        status: "valid",
        sentAt: new Date("2250-09-10T03:00:00Z"),
      });
      await addTestAttendance(db, records.staff.id, {
        ...target,
        status: "rejected",
        sentAt: new Date("2250-09-10T05:00:00Z"),
      });

      const answer = await record(db, records, { replaces: "rejected" });

      expect(answer).toEqual(
        refusal("Status kehadiran baru saja berubah. Tekan Simpan lagi."),
      );
      const kept = await stored(db);
      expect(kept.map(({ status }) => status).sort()).toEqual([
        "rejected",
        "valid",
      ]);
      expect(await logLines(db)).toEqual([]);
    });
  });

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Penilai Mahasiswa", "assessor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)(
    "refuses %s, who has no right to verify, and saves nothing",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        // Even the student's own account, sending the exact keys.
        const other = { ...records.student, roles: [role] };

        const answer = await recordAttendance(db, other, sent(records), AT);

        expect(answer).toEqual(
          refusal("Anda tidak berhak memverifikasi presensi."),
        );
        expect(await stored(db)).toEqual([]);
        expect(await logLines(db)).toEqual([]);
      });
    },
  );

  it("asks for the student, the activity and the status when one is missing or is none of the choices", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(await record(db, records, { studentId: "" })).toEqual(
        refusal("Pilih mahasiswa."),
      );
      expect(await record(db, records, { scheduleId: "" })).toEqual(
        refusal("Pilih kegiatan."),
      );
      expect(await record(db, records, { kind: "rejected" })).toEqual(
        refusal("Pilih status kehadiran."),
      );
      expect(await record(db, records, { note: "a".repeat(201) })).toEqual(
        refusal("Keterangan paling banyak 200 karakter."),
      );
      expect(await stored(db)).toEqual([]);
    });
  });

  it("records nothing for a student who is not Aktif, is unknown, or is no key at all", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const notFound = refusal(
        "Mahasiswa aktif ini tidak ditemukan. Cari lagi, lalu pilih dari hasil pencarian.",
      );
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const studentId of [unknown, "bukan-kunci", undefined, 7]) {
        expect(await record(db, records, { studentId })).toEqual(notFound);
      }
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, records.student.studentId));
      expect(await record(db, records)).toEqual(notFound);
      expect(await stored(db)).toEqual([]);
    });
  });

  it("records nothing for an activity that has not started, is meant for another semester, was removed, or is unknown", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, activityId, periodId } = records;
      const notFound = refusal(
        "Kegiatan ini tidak ada dalam jadwal mahasiswa tersebut atau belum dimulai. Pilih kegiatan dari daftar.",
      );
      const tomorrow = await addTestSchedule(db, {
        activityId,
        academicPeriodId: periodId,
        changedBy: staff.id,
        startsOn: "2250-09-21",
      });
      const otherSemester = await addTestSchedule(db, {
        activityId: await addTestActivity(db, staff.id, { semester: 5 }),
        academicPeriodId: periodId,
        changedBy: staff.id,
        startsOn: "2250-09-10",
      });
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const scheduleId of [tomorrow, otherSemester, unknown, "x", 7]) {
        expect(await record(db, records, { scheduleId })).toEqual(notFound);
      }
      await db
        .update(activitySchedules)
        .set({ deletedAt: AT, deletedBy: staff.id })
        .where(eq(activitySchedules.id, records.scheduleId));
      expect(await record(db, records)).toEqual(notFound);
      expect(await stored(db)).toEqual([]);
    });
  });

  it("records an activity that starts today", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const today = await addTestSchedule(db, {
        activityId: records.activityId,
        academicPeriodId: records.periodId,
        changedBy: records.staff.id,
        startsOn: "2250-09-20",
      });

      const answer = await record(db, records, { scheduleId: today });

      expect(answer.state.done).toBe(`Kehadiran ${NAME} dicatat.`);
    });
  });
});
