import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  activityAttendanceChanges,
  activityAttendances,
  activityClarificationChanges,
  activityClarifications,
  activitySchedules,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { decideClarification } from "./decide-clarification";
import { historyRowOf } from "./history-row";
import { readStudentActivities } from "./student-activities";
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
 * This file's own sample values: the Tahun akademik 2249 and 2250, the
 * program UJIKLARPUTUS and the NIMs 9973100000 to 9973100099.
 */

const inTestDatabase = withTestDatabase();

const TODAY = "2250-10-13";
/** Ten in the morning on campus. */
const NOW = new Date("2250-10-13T03:00:00Z");

interface Records {
  assessor: AccountForAccess;
  /** A student of angkatan 2249, in semester 3 during Ganjil 2250. */
  student: TestStudentAccount;
  /**
   * Required, held three days ago with an upload range of 1 hari: its
   * upload time is over and its clarification time is open.
   */
  scheduleId: string;
  /** The student's clarification for it, which waits, with the reason Sakit. */
  clarificationId: string;
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Putusan", ["assessor"]);
  const activityId = await addTestActivity(db, assessor.id);
  const periods = await addTestPeriods(db, 2250);
  const programId = await addTestProgram(db, "UJIKLARPUTUS");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973100001",
    name: "Mahasiswa Uji Putusan",
    cohortYear: 2249,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: assessor.id,
    startsOn: daysAfter(TODAY, -3),
  });
  const clarificationId = await addTestClarification(db, assessor.id, {
    scheduleId,
    studentId: student.studentId,
    status: "submitted",
  });
  return {
    assessor: accountOf(assessor.id, assessor.roles),
    student,
    scheduleId,
    clarificationId,
  };
}

function decide(
  db: Database,
  records: Records,
  kind: unknown,
  note: unknown = "",
  account: AccountForAccess = records.assessor,
) {
  const sent = { clarificationId: records.clarificationId, kind, note };
  return decideClarification(db, account, sent, NOW, true);
}

async function keptClarification(db: Database, records: Records) {
  const [kept] = await db
    .select()
    .from(activityClarifications)
    .where(eq(activityClarifications.id, records.clarificationId));
  if (!kept) throw new Error("The clarification is gone.");
  return kept;
}

function keptAttendances(db: Database, records: Records) {
  return db
    .select()
    .from(activityAttendances)
    .where(eq(activityAttendances.scheduleId, records.scheduleId));
}

function attendanceLines(db: Database, attendanceId: string) {
  return db
    .select()
    .from(activityAttendanceChanges)
    .where(eq(activityAttendanceChanges.attendanceId, attendanceId));
}

function clarificationLines(db: Database, records: Records) {
  return db
    .select()
    .from(activityClarificationChanges)
    .where(
      eq(activityClarificationChanges.clarificationId, records.clarificationId),
    );
}

/** Confirms a refused decision left the clarification, the attendance and the log alone. */
async function expectNothingChanged(db: Database, records: Records) {
  expect(await keptClarification(db, records)).toMatchObject({
    status: "submitted",
    acceptedAs: null,
    note: "",
    decidedAt: null,
    decidedBy: null,
  });
  expect(await keptAttendances(db, records)).toEqual([]);
  expect(await clarificationLines(db, records)).toEqual([]);
}

async function shownToStudent(db: Database, records: Records) {
  const answer = await readStudentActivities(db, records.student, NOW, 1);
  if (answer.kind !== "found") throw new Error("The student was refused.");
  return answer.activities;
}

describe("accepting a clarification", () => {
  it("as present records the attendance Hadir for a student who sent nothing, with the reason as Keterangan, and says so on the card", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const answer = await decide(db, records, "present");

      expect(answer.state).toEqual({
        error: null,
        done: "Klarifikasi diterima; status kehadiran diperbarui.",
      });
      expect(answer.card).toMatchObject({
        id: records.clarificationId,
        status: "accepted",
        decision: {
          result: "Diterima sebagai hadir",
          by: "(Penilai Uji Putusan, 13 Okt 2250, 10.00)",
        },
      });
      expect(await keptClarification(db, records)).toMatchObject({
        status: "accepted",
        acceptedAs: "valid",
        note: "",
        decidedAt: NOW,
        decidedBy: records.assessor.id,
      });
      expect(await keptAttendances(db, records)).toMatchObject([
        {
          studentId: records.student.studentId,
          status: "valid",
          note: "Klarifikasi: Sakit",
          sentAt: null,
          photoKey: null,
          decidedAt: NOW,
          decidedBy: records.assessor.id,
        },
      ]);
    });
  });

  it("writes a line into the log of attendance decisions and one into the log of clarification decisions: who, when, before and after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await decide(db, records, "present", "  Sudah dicek ke panitia.  ");

      const [attendance] = await keptAttendances(db, records);
      expect(await attendanceLines(db, attendance?.id ?? "")).toMatchObject([
        {
          changedBy: records.assessor.id,
          changedAt: NOW,
          statusBefore: null,
          noteBefore: null,
          statusAfter: "valid",
          noteAfter: "Klarifikasi: Sakit",
        },
      ]);
      expect(await clarificationLines(db, records)).toMatchObject([
        {
          changedBy: records.assessor.id,
          changedAt: NOW,
          statusBefore: "submitted",
          statusAfter: "accepted",
          acceptedAs: "valid",
          note: "Sudah dicek ke panitia.",
        },
      ]);
    });
  });

  it("as a dispensation changes the newest attendance in place, a rejected photo keeping its picture, and keeps the Catatan written with it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const attendanceId = await addTestAttendance(db, records.assessor.id, {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
        photoKey: "attendance-photos/uji-putusan.jpg",
      });

      const answer = await decide(db, records, "dispensation", "Surat sesuai.");

      expect(answer.card?.decision?.result).toBe(
        "Diterima sebagai dispensasi: Surat sesuai.",
      );
      expect(await keptClarification(db, records)).toMatchObject({
        status: "accepted",
        acceptedAs: "dispensation",
        note: "Surat sesuai.",
      });
      expect(await keptAttendances(db, records)).toMatchObject([
        {
          id: attendanceId,
          status: "dispensation",
          note: "Klarifikasi: Sakit",
          photoKey: "attendance-photos/uji-putusan.jpg",
          decidedBy: records.assessor.id,
        },
      ]);
      expect(await attendanceLines(db, attendanceId)).toMatchObject([
        {
          statusBefore: "rejected",
          noteBefore: "Wajah tidak terlihat jelas",
          statusAfter: "dispensation",
          noteAfter: "Klarifikasi: Sakit",
        },
      ]);
    });
  });

  it("replaces a photo that still waits", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const attendanceId = await addTestAttendance(db, records.assessor.id, {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
        status: "waiting",
      });

      const answer = await decide(db, records, "present");

      expect(answer.state.done).not.toBeNull();
      expect(await keptAttendances(db, records)).toMatchObject([
        { id: attendanceId, status: "valid", note: "Klarifikasi: Sakit" },
      ]);
    });
  });

  it.each([
    ["valid", "Hadir"],
    ["dispensation", "Dispensasi"],
  ] as const)(
    "is refused when the attendance is already %s, as after a record made by hand: nothing changes, the message names the status, and it can still be rejected with a note",
    async (status, words) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const attendanceId = await addTestAttendance(db, records.assessor.id, {
          scheduleId: records.scheduleId,
          studentId: records.student.studentId,
          status,
          note: "Dicatat manual.",
          sentAt: null,
        });

        const present = await decide(db, records, "present");
        const dispensation = await decide(db, records, "dispensation");

        const error = `Kehadiran mahasiswa ini sudah berstatus ${words} pada kegiatan ini, sehingga klarifikasi tidak dapat diterima. Tolak dengan catatan bila perlu.`;
        expect(present.state).toEqual({ error, done: null });
        expect(dispensation.state).toEqual({ error, done: null });
        expect(present.card).toMatchObject({ status: "submitted" });
        expect(await keptClarification(db, records)).toMatchObject({
          status: "submitted",
          decidedBy: null,
        });
        expect(await keptAttendances(db, records)).toMatchObject([
          { id: attendanceId, status, note: "Dicatat manual." },
        ]);
        expect(await attendanceLines(db, attendanceId)).toEqual([]);
        expect(await clarificationLines(db, records)).toEqual([]);

        const rejected = await decide(db, records, "reject", "Sudah tercatat.");

        expect(rejected.state.done).toBe("Klarifikasi ditolak.");
      });
    },
  );

  it("as present raises Nilai kehadiran kegiatan of the student, by the rule the score already has", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const before = (await shownToStudent(db, records)).score;

      await decide(db, records, "present");

      expect(before).toEqual({ attended: 0, counted: 1 });
      expect((await shownToStudent(db, records)).score).toEqual({
        attended: 1,
        counted: 1,
      });
    });
  });

  it("as a dispensation leaves the activity out of Nilai kehadiran kegiatan", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await decide(db, records, "dispensation");

      const shown = await shownToStudent(db, records);
      expect(shown.score).toEqual({ attended: 0, counted: 0 });
      expect(shown.dispensations).toBe(1);
    });
  });
});

describe("rejecting a clarification", () => {
  it.each([
    ["no Catatan", ""],
    ["a Catatan of spaces", "   "],
    ["a Catatan that is no text", { note: "Uji" }],
  ])(
    "changes nothing with %s, and says to write the reason",
    async (_, note) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        const answer = await decide(db, records, "reject", note);

        expect(answer).toEqual({
          state: {
            error: "Tulis alasan penolakan di kolom catatan.",
            done: null,
          },
          card: null,
        });
        await expectNothingChanged(db, records);
      });
    },
  );

  it("with a Catatan keeps the note, leaves the attendance alone and writes a line into the log of clarification decisions", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const attendanceId = await addTestAttendance(db, records.assessor.id, {
        scheduleId: records.scheduleId,
        studentId: records.student.studentId,
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
      });

      const answer = await decide(
        db,
        records,
        "reject",
        "Lampiran tidak terbaca.",
      );

      expect(answer.state).toEqual({
        error: null,
        done: "Klarifikasi ditolak.",
      });
      expect(answer.card).toMatchObject({
        status: "rejected",
        decision: {
          result: "Ditolak: Lampiran tidak terbaca.",
          by: "(Penilai Uji Putusan, 13 Okt 2250, 10.00)",
        },
      });
      expect(await keptClarification(db, records)).toMatchObject({
        status: "rejected",
        acceptedAs: null,
        note: "Lampiran tidak terbaca.",
        decidedAt: NOW,
        decidedBy: records.assessor.id,
      });
      expect(await keptAttendances(db, records)).toMatchObject([
        {
          id: attendanceId,
          status: "rejected",
          note: "Wajah tidak terlihat jelas",
        },
      ]);
      expect(await attendanceLines(db, attendanceId)).toEqual([]);
      expect(await clarificationLines(db, records)).toMatchObject([
        {
          changedBy: records.assessor.id,
          changedAt: NOW,
          statusBefore: "submitted",
          statusAfter: "rejected",
          acceptedAs: null,
          note: "Lampiran tidak terbaca.",
        },
      ]);
    });
  });

  it("then shows the student Klarifikasi ditolak with the note, and Ajukan ulang while the clarification time is open", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await decide(db, records, "reject", "Lampiran tidak terbaca.");

      const shown = await shownToStudent(db, records);
      const [schedule] = shown.history.schedules;
      if (!schedule) throw new Error("The history holds no schedule.");
      const newest = shown.clarifications[schedule.id] ?? null;
      expect(schedule.id).toBe(records.scheduleId);
      expect(historyRowOf(schedule, TODAY, newest).clarification).toEqual({
        badge: "rejected",
        note: "Lampiran tidak terbaca.",
        action: "ask_again",
      });
      expect(
        historyRowOf(schedule, daysAfter(TODAY, 6), newest).clarification
          .action,
      ).toBeNull();
    });
  });
});

describe("a decision that is refused", () => {
  it("takes a Catatan of 200 characters and refuses one of 201, with an acceptance too", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const tooLong = await decide(db, records, "present", "a".repeat(201));

      expect(tooLong.state.error).toBe("Catatan paling banyak 200 karakter.");
      await expectNothingChanged(db, records);

      const fits = await decide(db, records, "reject", "a".repeat(200));

      expect(fits.state.done).toBe("Klarifikasi ditolak.");
    });
  });

  it.each([
    ["Pegawai UPK", "upk_staff"],
    ["Kepala Unit", "head_of_unit"],
    ["Direktur / Wakil Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)(
    "is refused for %s, who sends it by hand: nothing changes",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const sender = { ...records.student, roles: [role] };

        const accepted = await decide(db, records, "present", "", sender);
        const rejected = await decide(db, records, "reject", "Uji.", sender);

        const refusal = {
          state: {
            error: "Anda tidak berhak memutuskan klarifikasi.",
            done: null,
          },
          card: null,
        };
        expect(accepted).toEqual(refusal);
        expect(rejected).toEqual(refusal);
        await expectNothingChanged(db, records);
      });
    },
  );

  it("is not found for a clarification that does not exist, or a key that is no key", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const notFound = {
        state: {
          error: "Klarifikasi ini tidak ditemukan. Muat ulang halaman.",
          done: null,
        },
        card: null,
      };

      for (const clarificationId of [
        "00000000-0000-4000-8000-00000000dead",
        "bukan-kunci",
        "",
        null,
        { id: records.clarificationId },
      ]) {
        const answer = await decideClarification(
          db,
          records.assessor,
          { clarificationId, kind: "present", note: "" },
          NOW,
          true,
        );

        expect(answer).toEqual(notFound);
      }
      await expectNothingChanged(db, records);
    });
  });

  it("is not found for the clarification of a removed schedule: nothing changes", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await db
        .update(activitySchedules)
        .set({ deletedAt: NOW, deletedBy: records.assessor.id })
        .where(eq(activitySchedules.id, records.scheduleId));

      const answer = await decide(db, records, "present");

      expect(answer.state.error).toBe(
        "Klarifikasi ini tidak ditemukan. Muat ulang halaman.",
      );
      expect(answer.card).toBeNull();
      await expectNothingChanged(db, records);
    });
  });

  it("is not understood when it is none of the three decisions", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const kind of ["valid", "accepted", "", null, 1]) {
        const answer = await decide(db, records, kind, "Uji.");

        expect(answer.state.error).toBe(
          "Putusan tidak dikenal. Muat ulang halaman.",
        );
      }
      await expectNothingChanged(db, records);
    });
  });

  it("changes nothing when the clarification was decided already: the first decision stands, with the card as it is now", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = await addTestActor(db, "Penilai Uji Kedua", ["assessor"]);
      await decide(db, records, "reject", "Lampiran tidak terbaca.");

      const second = await decide(
        db,
        records,
        "present",
        "",
        accountOf(other.id, other.roles),
      );

      expect(second.state).toEqual({
        error: "Klarifikasi ini sudah diputuskan oleh petugas lain.",
        done: null,
      });
      expect(second.card).toMatchObject({
        status: "rejected",
        decision: { result: "Ditolak: Lampiran tidak terbaca." },
      });
      expect(await keptClarification(db, records)).toMatchObject({
        status: "rejected",
        decidedBy: records.assessor.id,
      });
      expect(await keptAttendances(db, records)).toEqual([]);
      expect(await clarificationLines(db, records)).toHaveLength(1);
    });
  });
});

describe("the line a decision writes into the log of clarification decisions", () => {
  it("cannot be changed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await decide(db, records, "reject", "Lampiran tidak terbaca.");

      const change = db
        .update(activityClarificationChanges)
        .set({ note: "" })
        .where(
          eq(
            activityClarificationChanges.clarificationId,
            records.clarificationId,
          ),
        );

      await expect(change).rejects.toThrow();
    });
  });

  it("cannot be removed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await decide(db, records, "present");

      const removal = db
        .delete(activityClarificationChanges)
        .where(
          eq(
            activityClarificationChanges.clarificationId,
            records.clarificationId,
          ),
        );

      await expect(removal).rejects.toThrow();
    });
  });
});
