import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  activityClarifications,
  activitySchedules,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "@/files/memory-store";
import { NOT_OWN_ACTIVITY } from "./send-attendance-photo";
import {
  CLARIFICATION_CLOSED,
  CLARIFICATION_NOT_ALLOWED,
  FILE_NOT_KEPT,
  NO_FILE_STORAGE,
  NOT_TO_CLARIFY,
  type SentClarification,
  sendClarification,
} from "./send-clarification";
import { testPaper, testPngPicture } from "./test-paper";
import { testPhoto } from "./test-photo";
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
 * This file's own sample values: the Tahun akademik 2300, the program
 * UJIKIRIMKLAR and the NIMs 9973700000 to 9973700099.
 */

const inTestDatabase = withTestDatabase();

/** Ten in the morning on campus, on the day of the schedule. */
const WHILE_UPLOAD_OPEN = new Date("2300-10-13T03:00:00Z");
/** Ten in the morning on campus, two days after the last upload day. */
const WHILE_OPEN = new Date("2300-10-16T03:00:00Z");
/** The last second of the seventh day after the last upload day, on campus. */
const LAST_MOMENT = new Date("2300-10-21T16:59:59Z");
/** Midnight on campus, when the eighth day starts. */
const TOO_LATE = new Date("2300-10-21T17:00:00Z");
const MEGABYTE = 1024 * 1024;
const SENT = { ok: true, value: "Klarifikasi terkirim." };

function said(error: string) {
  return { ok: false, error };
}

interface Records {
  staffId: string;
  activityId: string;
  periodId: string;
  programId: number;
  /** A student of angkatan 2299: in semester 3 during Ganjil 2300. */
  student: TestStudentAccount;
  /**
   * A schedule of semester 3 on the morning of 13 October 2300, which
   * takes photos until the end of 14 October, and so clarifications
   * until the end of 21 October.
   */
  scheduleId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Penilai Uji Kirim Klar", ["assessor"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2300);
  const programId = await addTestProgram(db, "UJIKIRIMKLAR");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973700001",
    name: "Mahasiswa Uji Kirim Klar",
    cohortYear: 2299,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2300-10-13",
  });
  return {
    staffId: staff.id,
    activityId,
    periodId: periods.oddId,
    programId,
    student,
    scheduleId,
  };
}

function sentFor(
  scheduleId: string,
  more: Partial<SentClarification> = {},
): SentClarification {
  return {
    scheduleId,
    reason: "technical_trouble",
    explanation: "Aplikasi gagal mengunggah swafoto di lokasi kegiatan.",
    file: { name: "surat-keterangan.pdf", bytes: testPaper() },
    ...more,
  };
}

async function expectNothingKept(db: Database, store: MemoryStore) {
  expect(await db.select().from(activityClarifications)).toEqual([]);
  expect(store.files.size).toBe(0);
}

describe("sendClarification", () => {
  it("keeps the file and a clarification that waits, with the time of the server, for a student who sent nothing", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      const sent = sentFor(scheduleId, {
        explanation: "  Aplikasi gagal mengunggah swafoto.\n",
      });

      const answer = await sendClarification(
        db,
        store,
        student,
        sent,
        WHILE_OPEN,
      );

      expect(answer).toEqual(SENT);
      const [kept, ...others] = await db.select().from(activityClarifications);
      expect(others).toEqual([]);
      expect(kept).toMatchObject({
        scheduleId,
        studentId: student.studentId,
        reason: "technical_trouble",
        explanation: "Aplikasi gagal mengunggah swafoto.",
        fileName: "surat-keterangan.pdf",
        fileContentType: "application/pdf",
        fileSize: 64,
        status: "submitted",
        acceptedAs: null,
        note: "",
        sentAt: WHILE_OPEN,
        decidedAt: null,
        decidedBy: null,
      });
      expect(kept?.fileKey).toMatch(
        /^attendance-clarifications\/[0-9a-f-]{36}$/,
      );
      expect(store.files.get(kept?.fileKey ?? "")).toEqual({
        bytes: testPaper(),
        contentType: "application/pdf",
      });
    });
  });

  it("takes one for a rejected photo, also while photos are still taken", async () => {
    await inTestDatabase(async (db) => {
      const { staffId, student, scheduleId } = await addRecords(db);
      const { studentId } = student;
      await addTestAttendance(db, staffId, {
        scheduleId,
        studentId,
        status: "rejected",
      });

      const answer = await sendClarification(
        db,
        memoryStore(),
        student,
        sentFor(scheduleId),
        WHILE_UPLOAD_OPEN,
      );

      expect(answer).toEqual(SENT);
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
    });
  });

  it.each([
    ["a JPG picture", "foto surat.JPG", testPhoto(), "image/jpeg"],
    ["a PNG picture", "foto-surat.png", testPngPicture(), "image/png"],
  ])(
    "takes %s, kept under its own kind and name",
    async (_kind, name, bytes, contentType) => {
      await inTestDatabase(async (db) => {
        const { student, scheduleId } = await addRecords(db);
        const store = memoryStore();
        const sent = sentFor(scheduleId, { file: { name, bytes } });

        const answer = await sendClarification(
          db,
          store,
          student,
          sent,
          WHILE_OPEN,
        );

        const [kept] = await db.select().from(activityClarifications);
        expect(answer).toEqual(SENT);
        expect(kept).toMatchObject({
          fileName: name,
          fileContentType: contentType,
        });
        expect(store.files.get(kept?.fileKey ?? "")?.contentType).toBe(
          contentType,
        );
      });
    },
  );

  it("keeps the name of the file without a folder before it", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const file = { name: "..\\..\\rahasia\\surat.pdf", bytes: testPaper() };

      await sendClarification(
        db,
        memoryStore(),
        student,
        sentFor(scheduleId, { file }),
        WHILE_OPEN,
      );

      const [kept] = await db.select().from(activityClarifications);
      expect(kept?.fileName).toBe("surat.pdf");
    });
  });

  it("keeps it for the account's own student only: nothing sent can name another", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = await addTestStudentAccount(db, records.programId, {
        nim: "9973700002",
        name: "Mahasiswa Uji Lain Klar",
        cohortYear: 2299,
      });
      const named = {
        ...sentFor(records.scheduleId),
        studentId: other.studentId,
      };

      await sendClarification(
        db,
        memoryStore(),
        records.student,
        named,
        WHILE_OPEN,
      );

      const kept = await db.select().from(activityClarifications);
      expect(kept.map(({ studentId }) => studentId)).toEqual([
        records.student.studentId,
      ]);
    });
  });

  it.each([
    ["Penilai Mahasiswa", ["assessor"]],
    ["Pegawai UPK", ["upk_staff"]],
    ["Kepala Unit", ["head_of_unit"]],
    ["Pengasuh", ["mentor"]],
    ["an account with no role", []],
  ] as const)(
    "refuses %s: only a student asks, for themselves",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { student, scheduleId } = await addRecords(db);
        const store = memoryStore();
        const account = { ...student, roles: [...roles] };

        const answer = await sendClarification(
          db,
          store,
          account,
          sentFor(scheduleId),
          WHILE_OPEN,
        );

        expect(answer).toEqual(CLARIFICATION_NOT_ALLOWED);
        expect(answer).toEqual(
          said("Anda tidak berhak mengajukan klarifikasi."),
        );
        await expectNothingKept(db, store);
      });
    },
  );

  it("keeps it for the own student of an account that also holds a role that sees every student", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const wide = {
        ...student,
        roles: ["student" as const, "bam_bphk" as const],
      };

      const answer = await sendClarification(
        db,
        memoryStore(),
        wide,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      const kept = await db.select().from(activityClarifications);
      expect(answer).toEqual(SENT);
      expect(kept.map(({ studentId }) => studentId)).toEqual([
        student.studentId,
      ]);
    });
  });

  it.each(["valid", "dispensation", "waiting"] as const)(
    "refuses a clarification for an activity where the attendance is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { staffId, student, scheduleId } = await addRecords(db);
        const { studentId } = student;
        const store = memoryStore();
        await addTestAttendance(db, staffId, { scheduleId, studentId, status });

        const answer = await sendClarification(
          db,
          store,
          student,
          sentFor(scheduleId),
          WHILE_OPEN,
        );

        expect(answer).toEqual(NOT_TO_CLARIFY);
        expect(answer).toEqual(
          said(
            "Klarifikasi hanya untuk kegiatan yang tercatat tidak hadir atau presensinya ditolak.",
          ),
        );
        await expectNothingKept(db, store);
      });
    },
  );

  it("refuses one with nothing sent while a photo can still be sent", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();

      const answer = await sendClarification(
        db,
        store,
        student,
        sentFor(scheduleId),
        WHILE_UPLOAD_OPEN,
      );

      expect(answer).toEqual(NOT_TO_CLARIFY);
      await expectNothingKept(db, store);
    });
  });

  it("takes one up to the last moment of the seventh day after the last upload day, in campus time", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);

      const answer = await sendClarification(
        db,
        memoryStore(),
        student,
        sentFor(scheduleId),
        LAST_MOMENT,
      );

      expect(answer).toEqual(SENT);
    });
  });

  it('refuses one that arrives after the clarification time with "Batas klarifikasi sudah lewat." and keeps nothing, whatever the form says about the time', async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      const backdated = { ...sentFor(scheduleId), sentAt: "2300-10-16" };

      const answer = await sendClarification(
        db,
        store,
        student,
        backdated,
        TOO_LATE,
      );

      expect(answer).toEqual(CLARIFICATION_CLOSED);
      expect(answer).toEqual(said("Batas klarifikasi sudah lewat."));
      await expectNothingKept(db, store);
    });
  });

  it("refuses one for an activity that is not meant for the student: of another semester, removed, or unknown, with one message", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { staffId, periodId, student } = records;
      const store = memoryStore();
      const otherSemester = await addTestActivity(db, staffId, {
        semester: 1,
        name: "Kegiatan uji semester satu",
      });
      const notMeant = await addTestSchedule(db, {
        activityId: otherSemester,
        academicPeriodId: periodId,
        changedBy: staffId,
        startsOn: "2300-10-13",
      });
      const removed = await addTestSchedule(db, {
        activityId: records.activityId,
        academicPeriodId: periodId,
        changedBy: staffId,
        startsOn: "2300-10-13",
        deletedAt: new Date(),
        deletedBy: staffId,
      });
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const scheduleId of [
        notMeant,
        removed,
        unknown,
        "bukan-kunci",
        "",
      ]) {
        const answer = await sendClarification(
          db,
          store,
          student,
          sentFor(scheduleId),
          WHILE_OPEN,
        );

        expect(answer).toEqual(NOT_OWN_ACTIVITY);
      }
      await expectNothingKept(db, store);
    });
  });

  it("refuses a student who is not Aktif: they take part in no activity", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, student.studentId));

      const answer = await sendClarification(
        db,
        store,
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      expect(answer).toEqual(NOT_OWN_ACTIVITY);
      await expectNothingKept(db, store);
    });
  });

  it.each([
    [
      "an explanation of fewer than 10 characters",
      { explanation: "  sakit   " },
      "Tulis penjelasan minimal satu kalimat.",
    ],
    [
      "an explanation of more than 1,000 characters",
      { explanation: "a".repeat(1001) },
      "Penjelasan paling banyak 1.000 karakter.",
    ],
    ["no file", { file: null }, "Lampirkan dokumen pendukung."],
    [
      "an empty file",
      { file: { name: "surat.pdf", bytes: new Uint8Array() } },
      "Lampirkan dokumen pendukung.",
    ],
    [
      "a drawing that can carry code",
      { file: { name: "gambar.svg", bytes: testPaper() } },
      "Lampiran harus berupa PDF atau gambar.",
    ],
    [
      "a page renamed to .pdf",
      {
        file: {
          name: "surat.pdf",
          bytes: new TextEncoder().encode("<html><script>"),
        },
      },
      "Lampiran harus berupa PDF atau gambar.",
    ],
    [
      "a PDF renamed to .png",
      { file: { name: "surat.png", bytes: testPaper() } },
      "Lampiran harus berupa PDF atau gambar.",
    ],
    [
      "a file one byte over 5 MB",
      { file: { name: "surat.pdf", bytes: testPaper(5 * MEGABYTE + 1) } },
      "Ukuran lampiran maksimal 5 MB.",
    ],
    [
      "a reason that is not on the list",
      { reason: "Sakit" },
      "Pilih alasan klarifikasi.",
    ],
    [
      "no explanation and no file: the explanation is asked for first",
      { explanation: "", file: null },
      "Tulis penjelasan minimal satu kalimat.",
    ],
  ])("refuses %s, and keeps nothing", async (_what, wrong, message) => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();

      const answer = await sendClarification(
        db,
        store,
        student,
        sentFor(scheduleId, wrong),
        WHILE_OPEN,
      );

      expect(answer).toEqual(said(message));
      await expectNothingKept(db, store);
    });
  });

  it("takes a file of exactly 5 MB and an explanation of exactly 1,000 characters", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const sent = sentFor(scheduleId, {
        explanation: "a".repeat(1000),
        file: { name: "surat.pdf", bytes: testPaper(5 * MEGABYTE) },
      });

      const answer = await sendClarification(
        db,
        memoryStore(),
        student,
        sent,
        WHILE_OPEN,
      );

      expect(answer).toEqual(SENT);
    });
  });

  it("leaves out a character the database keeps no text with", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const sent = sentFor(scheduleId, {
        explanation: "Demam sejak\u0000 malam sebelumnya.",
      });

      await sendClarification(db, memoryStore(), student, sent, WHILE_OPEN);

      const [kept] = await db.select().from(activityClarifications);
      expect(kept?.explanation).toBe("Demam sejak malam sebelumnya.");
    });
  });

  it("saves nothing where file keeping is off, and says files cannot be stored yet", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);

      const answer = await sendClarification(
        db,
        null,
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      expect(answer).toEqual(NO_FILE_STORAGE);
      expect(answer).toEqual(
        said(
          "Lampiran belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
        ),
      );
      expect(await db.select().from(activityClarifications)).toEqual([]);
    });
  });

  it("saves nothing when the file storage cannot be reached, and says to try again", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);

      const answer = await sendClarification(
        db,
        unreachableStore(),
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      expect(answer).toEqual(FILE_NOT_KEPT);
      expect(answer).toEqual(said("Lampiran tidak dapat disimpan. Coba lagi."));
      expect(await db.select().from(activityClarifications)).toEqual([]);
    });
  });

  it("removes the kept file again when the clarification is then not saved", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      // The schedule is removed after the send has looked at it, and
      // before the clarification is saved: the save then fails.
      const keptThenRemoved: MemoryStore = {
        ...store,
        async put(key, file) {
          await store.put(key, file);
          await db
            .delete(activitySchedules)
            .where(eq(activitySchedules.id, scheduleId));
        },
      };

      const sending = sendClarification(
        db,
        keptThenRemoved,
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      await expect(sending).rejects.toThrow();
      expect(store.files.size).toBe(0);
    });
  });

  it("keeps the first one when the form is sent again while it waits, and says the same", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      const first = sentFor(scheduleId);
      const second = sentFor(scheduleId, {
        reason: "sick",
        file: { name: "surat-lain.pdf", bytes: testPaper(80) },
      });

      await sendClarification(db, store, student, first, WHILE_OPEN);
      const again = await sendClarification(
        db,
        store,
        student,
        second,
        new Date("2300-10-17T03:00:00Z"),
      );

      const kept = await db.select().from(activityClarifications);
      expect(again).toEqual(SENT);
      expect(kept).toHaveLength(1);
      expect(kept[0]).toMatchObject({
        reason: "technical_trouble",
        fileName: "surat-keterangan.pdf",
        sentAt: WHILE_OPEN,
      });
      expect([...store.files.keys()]).toEqual([kept[0]?.fileKey]);
    });
  });

  it("takes one again after a rejection: a new clarification that waits, while the rejected one stays stored", async () => {
    await inTestDatabase(async (db) => {
      const { staffId, student, scheduleId } = await addRecords(db);
      const { studentId } = student;
      const rejectedId = await addTestClarification(db, staffId, {
        scheduleId,
        studentId,
        status: "rejected",
        note: "Surat tidak terbaca.",
        sentAt: new Date("2300-10-15T03:00:00Z"),
        decidedAt: new Date("2300-10-15T08:00:00Z"),
      });

      const answer = await sendClarification(
        db,
        memoryStore(),
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      const kept = await db.select().from(activityClarifications);
      expect(answer).toEqual(SENT);
      expect(kept).toHaveLength(2);
      expect(kept.find(({ id }) => id === rejectedId)).toMatchObject({
        status: "rejected",
        note: "Surat tidak terbaca.",
      });
      expect(kept.find(({ id }) => id !== rejectedId)).toMatchObject({
        status: "submitted",
        sentAt: WHILE_OPEN,
      });
    });
  });

  it("takes none again after a rejection once the clarification time is over", async () => {
    await inTestDatabase(async (db) => {
      const { staffId, student, scheduleId } = await addRecords(db);
      const { studentId } = student;
      const store = memoryStore();
      await addTestClarification(db, staffId, {
        scheduleId,
        studentId,
        status: "rejected",
      });

      const answer = await sendClarification(
        db,
        store,
        student,
        sentFor(scheduleId),
        TOO_LATE,
      );

      expect(answer).toEqual(CLARIFICATION_CLOSED);
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
      expect(store.files.size).toBe(0);
    });
  });

  it("takes none once one was accepted: the attendance it gave stands", async () => {
    await inTestDatabase(async (db) => {
      const { staffId, student, scheduleId } = await addRecords(db);
      const { studentId } = student;
      const store = memoryStore();
      await addTestClarification(db, staffId, {
        scheduleId,
        studentId,
        status: "accepted",
      });
      await addTestAttendance(db, staffId, {
        scheduleId,
        studentId,
        status: "valid",
        sentAt: null,
        note: "Klarifikasi: Sakit",
      });

      const answer = await sendClarification(
        db,
        store,
        student,
        sentFor(scheduleId),
        WHILE_OPEN,
      );

      expect(answer).toEqual(NOT_TO_CLARIFY);
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
      expect(store.files.size).toBe(0);
    });
  });
});
