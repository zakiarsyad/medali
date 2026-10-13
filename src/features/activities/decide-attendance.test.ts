import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  activityAttendanceChanges,
  activityAttendances,
  activitySchedules,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { type Decision, decideAttendance } from "./decide-attendance";
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
 * This file's own sample values: the Tahun akademik 2220, the program
 * UJIPUTUSAN and the NIMs 9972800000 to 9972800099.
 */

const inTestDatabase = withTestDatabase();

const AT = new Date("2220-09-10T06:00:00Z");
const VALID: Decision = { status: "valid" };
const REJECTED: Decision = {
  status: "rejected",
  note: "Wajah tidak terlihat jelas",
};

interface Records {
  staff: AccountForAccess;
  scheduleId: string;
  student: TestStudentAccount;
  /** A photo of the student that waits. */
  attendanceId: string;
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Putusan", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2220);
  const programId = await addTestProgram(db, "UJIPUTUSAN");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972800001",
    name: "Mahasiswa Uji Putusan",
    cohortYear: 2219,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2220-09-10",
  });
  const attendanceId = await addTestAttendance(db, staff.id, {
    scheduleId,
    studentId: student.studentId,
    status: "waiting",
    photoKey: "attendance-photos/uji-putusan",
  });
  return {
    staff: accountOf(staff.id, staff.roles),
    scheduleId,
    student,
    attendanceId,
  };
}

async function stored(db: Database, id: string) {
  const [attendance] = await db
    .select()
    .from(activityAttendances)
    .where(eq(activityAttendances.id, id));
  if (!attendance) throw new Error("The attendance is gone.");
  return attendance;
}

function logLines(db: Database) {
  return db.select().from(activityAttendanceChanges);
}

function decide(db: Database, records: Records, decision: Decision) {
  const { staff, attendanceId } = records;
  return decideAttendance(db, staff, attendanceId, decision, AT, true);
}

describe("decideAttendance", () => {
  it("validates a waiting photo: the card shows Hadir with the name of Pegawai UPK", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const answer = await decide(db, records, VALID);

      expect(answer.state).toEqual({
        error: null,
        done: "Presensi divalidasi.",
      });
      expect(answer.card).toMatchObject({
        id: records.attendanceId,
        status: "valid",
        note: "",
        decidedBy: "Pegawai Uji Putusan",
      });
      expect(await stored(db, records.attendanceId)).toMatchObject({
        status: "valid",
        note: "",
        decidedAt: AT,
        decidedBy: records.staff.id,
        sentAt: TEST_SENT_AT,
        photoKey: "attendance-photos/uji-putusan",
      });
    });
  });

  it("rejects a waiting photo and keeps the reason as its Keterangan", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const answer = await decide(db, records, REJECTED);

      expect(answer.state).toEqual({
        error: null,
        done: "Presensi ditolak: Wajah tidak terlihat jelas.",
      });
      expect(answer.card).toMatchObject({
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
        decidedBy: "Pegawai Uji Putusan",
      });
      expect(await stored(db, records.attendanceId)).toMatchObject({
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
        decidedBy: records.staff.id,
      });
    });
  });

  it.each([
    ["a validation", VALID, "valid", ""],
    ["a rejection", REJECTED, "rejected", "Wajah tidak terlihat jelas"],
  ] as const)(
    "writes one line into the log for %s: who, when, before and after",
    async (_kind, decision, statusAfter, noteAfter) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await decide(db, records, decision);

        expect(await logLines(db)).toEqual([
          expect.objectContaining({
            attendanceId: records.attendanceId,
            changedBy: records.staff.id,
            changedAt: AT,
            statusBefore: "waiting",
            noteBefore: "",
            statusAfter,
            noteAfter,
          }),
        ]);
      });
    },
  );

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Penilai Mahasiswa", "assessor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)(
    "refuses %s, who has no right to verify, and changes nothing",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        // Even the student's own account, sending the exact key.
        const other = { ...records.student, roles: [role] };

        for (const decision of [VALID, REJECTED]) {
          const answer = await decideAttendance(
            db,
            other,
            records.attendanceId,
            decision,
            AT,
            true,
          );

          expect(answer).toEqual({
            state: {
              error: "Anda tidak berhak memverifikasi presensi.",
              done: null,
            },
            card: null,
          });
        }
        expect(await stored(db, records.attendanceId)).toMatchObject({
          status: "waiting",
          decidedBy: null,
        });
        expect(await logLines(db)).toEqual([]);
      });
    },
  );

  it.each([
    ["validated", "valid"],
    ["rejected", "rejected"],
    ["replaced by a dispensation", "dispensation"],
  ] as const)(
    "keeps the first decision of a photo that was %s: the second person is told, and sees the card as it stands",
    async (_kind, status) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const first = await addTestActor(db, "Pegawai Uji Lebih Dulu", [
          "upk_staff",
        ]);
        await db
          .update(activityAttendances)
          .set({
            status,
            note: "Putusan pertama",
            decidedAt: TEST_SENT_AT,
            decidedBy: first.id,
          })
          .where(eq(activityAttendances.id, records.attendanceId));

        const answer = await decide(db, records, VALID);

        expect(answer.state).toEqual({
          error: "Presensi ini sudah diputuskan oleh petugas lain.",
          done: null,
        });
        expect(answer.card).toMatchObject({
          status,
          note: "Putusan pertama",
          decidedBy: "Pegawai Uji Lebih Dulu",
        });
        expect(await stored(db, records.attendanceId)).toMatchObject({
          status,
          decidedBy: first.id,
        });
        expect(await logLines(db)).toEqual([]);
      });
    },
  );

  it("finds nothing to decide for an unknown or malformed key, a record without a photo, and a removed schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staff, scheduleId, student } = records;
      const byHand = await addTestAttendance(db, staff.id, {
        scheduleId,
        studentId: student.studentId,
        status: "dispensation",
        sentAt: null,
      });
      const notFound = {
        state: {
          error: "Presensi ini tidak ditemukan. Muat ulang halaman.",
          done: null,
        },
        card: null,
      };
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const id of [unknown, "bukan-kunci", "", byHand]) {
        expect(await decideAttendance(db, staff, id, VALID, AT, true)).toEqual(
          notFound,
        );
      }
      await db
        .update(activitySchedules)
        .set({ deletedAt: AT, deletedBy: staff.id })
        .where(eq(activitySchedules.id, scheduleId));
      expect(await decide(db, records, VALID)).toEqual(notFound);
      expect(await stored(db, records.attendanceId)).toMatchObject({
        status: "waiting",
      });
      expect(await logLines(db)).toEqual([]);
    });
  });
});
