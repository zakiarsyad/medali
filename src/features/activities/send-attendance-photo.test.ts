import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { activityAttendances } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "@/files/memory-store";
import { PHOTO_FILE_NAME, PHOTO_MAX_BYTES } from "./attendance-photo";
import {
  ALREADY_DECIDED,
  NO_PHOTO_STORAGE,
  NOT_OWN_ACTIVITY,
  PHOTO_NOT_ALLOWED,
  PHOTO_NOT_KEPT,
  sendAttendancePhoto,
  UPLOAD_CLOSED,
  UPLOAD_NOT_OPEN,
} from "./send-attendance-photo";
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
 * This file's own sample values: the Tahun akademik 2170, the program
 * UJIKIRIMFOTO and the NIMs 9972300000 to 9972300099.
 */

const inTestDatabase = withTestDatabase();

/** Ten in the morning on campus, on the day of the schedule. */
const WHILE_OPEN = new Date("2170-10-13T03:00:00Z");
const PHOTO = { name: PHOTO_FILE_NAME, bytes: testPhoto() };
const SENT = {
  ok: true,
  value: "Foto kehadiran terunggah. Menunggu verifikasi Pegawai UPK.",
};

interface Records {
  staffId: string;
  activityId: string;
  periodId: string;
  programId: number;
  /** A student of angkatan 2169: in semester 3 during Ganjil 2170. */
  student: TestStudentAccount;
  /**
   * A schedule of semester 3 on the morning of 13 October 2170, from
   * 07:30, which takes photos until the end of 14 October.
   */
  scheduleId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Kirim Foto", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2170);
  const programId = await addTestProgram(db, "UJIKIRIMFOTO");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9972300001",
    name: "Mahasiswa Uji Kirim Foto",
    cohortYear: 2169,
  });
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2170-10-13",
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

async function expectNothingKept(db: Database, store: MemoryStore) {
  expect(await db.select().from(activityAttendances)).toEqual([]);
  expect(store.files.size).toBe(0);
}

describe("sendAttendancePhoto", () => {
  it("keeps the photo and an attendance that waits, with the time of the server", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();

      const sent = await sendAttendancePhoto(
        db,
        store,
        student,
        scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent).toEqual(SENT);
      const [kept, ...others] = await db.select().from(activityAttendances);
      expect(others).toEqual([]);
      expect(kept).toMatchObject({
        scheduleId,
        studentId: student.studentId,
        status: "waiting",
        note: "",
        sentAt: WHILE_OPEN,
        decidedAt: null,
        decidedBy: null,
      });
      expect(kept?.photoKey).toMatch(/^attendance-photos\/[0-9a-f-]{36}$/);
      expect(store.files.get(kept?.photoKey ?? "")).toEqual({
        bytes: PHOTO.bytes,
        contentType: "image/jpeg",
      });
    });
  });

  it("keeps it for the account's own student only: nothing sent can name another", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = await addTestStudentAccount(db, records.programId, {
        nim: "9972300002",
        name: "Mahasiswa Uji Lain Foto",
        cohortYear: 2169,
      });
      const wide = { ...records.student, roles: ["student", "bam_bphk"] };

      await sendAttendancePhoto(
        db,
        memoryStore(),
        wide as TestStudentAccount,
        records.scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      const kept = await db.select().from(activityAttendances);
      expect(kept.map(({ studentId }) => studentId)).toEqual([
        records.student.studentId,
      ]);
      expect(kept[0]?.studentId).not.toBe(other.studentId);
    });
  });

  it.each([
    ["text named as a picture", new TextEncoder().encode("bukan gambar")],
    ["a PNG picture", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])],
    ["an empty file", new Uint8Array()],
  ])(
    'refuses %s with "Berkas harus berupa gambar." and keeps nothing',
    async (_kind, bytes) => {
      await inTestDatabase(async (db) => {
        const { student, scheduleId } = await addRecords(db);
        const store = memoryStore();

        const sent = await sendAttendancePhoto(
          db,
          store,
          student,
          scheduleId,
          { name: PHOTO_FILE_NAME, bytes },
          WHILE_OPEN,
        );

        expect(sent).toEqual({
          ok: false,
          error: "Berkas harus berupa gambar.",
        });
        await expectNothingKept(db, store);
      });
    },
  );

  it('refuses a photo over 8 MB with "Ukuran foto maksimal 8 MB." and keeps nothing', async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      const large = {
        name: PHOTO_FILE_NAME,
        bytes: testPhoto(PHOTO_MAX_BYTES + 1),
      };

      const sent = await sendAttendancePhoto(
        db,
        store,
        student,
        scheduleId,
        large,
        WHILE_OPEN,
      );

      expect(sent).toEqual({ ok: false, error: "Ukuran foto maksimal 8 MB." });
      await expectNothingKept(db, store);
    });
  });

  it("takes a photo up to the last minute of the last upload day, in campus time", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const lastMinute = new Date("2170-10-14T16:59:00Z");

      const sent = await sendAttendancePhoto(
        db,
        memoryStore(),
        student,
        scheduleId,
        PHOTO,
        lastMinute,
      );

      expect(sent).toEqual(SENT);
    });
  });

  it('refuses a photo that arrives after the upload time has closed with "Masa unggah foto sudah ditutup." and keeps nothing', async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      // Midnight on campus, while it is still 14 October elsewhere.
      const closed = new Date("2170-10-14T17:00:00Z");

      const sent = await sendAttendancePhoto(
        db,
        store,
        student,
        scheduleId,
        PHOTO,
        closed,
      );

      expect(sent).toEqual(UPLOAD_CLOSED);
      expect(UPLOAD_CLOSED.error).toBe("Masa unggah foto sudah ditutup.");
      await expectNothingKept(db, store);
    });
  });

  it.each([
    ["the day before", "2170-10-12T03:00:00Z"],
    ["a minute before its first hour", "2170-10-13T00:29:00Z"],
  ])("refuses a photo sent %s and keeps nothing", async (_when, at) => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();

      const sent = await sendAttendancePhoto(
        db,
        store,
        student,
        scheduleId,
        PHOTO,
        new Date(at),
      );

      expect(sent).toEqual(UPLOAD_NOT_OPEN);
      await expectNothingKept(db, store);
    });
  });

  it("refuses a photo for an activity that is not meant for the student: of another semester, removed, or unknown", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { student, staffId } = records;
      const store = memoryStore();
      const ofSchedule = {
        academicPeriodId: records.periodId,
        changedBy: staffId,
        startsOn: "2170-10-13",
      };
      const fifthSemester = await addTestActivity(db, staffId, {
        semester: 5,
        name: "Kegiatan uji semester lima",
      });
      const ofOthers = await addTestSchedule(db, {
        ...ofSchedule,
        activityId: fifthSemester,
      });
      const removed = await addTestSchedule(db, {
        ...ofSchedule,
        activityId: records.activityId,
        deletedAt: WHILE_OPEN,
        deletedBy: staffId,
      });
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const id of [ofOthers, removed, unknown, "bukan-kunci", ""]) {
        const sent = await sendAttendancePhoto(
          db,
          store,
          student,
          id,
          PHOTO,
          WHILE_OPEN,
        );

        expect(sent).toEqual(NOT_OWN_ACTIVITY);
      }
      await expectNothingKept(db, store);
    });
  });

  it("refuses a student who is not Aktif: they take part in no activity", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();
      const onLeave = await addTestStudentAccount(db, records.programId, {
        nim: "9972300003",
        name: "Mahasiswa Uji Cuti Foto",
        cohortYear: 2169,
        status: "on_leave",
      });

      const sent = await sendAttendancePhoto(
        db,
        store,
        onLeave,
        records.scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent).toEqual(NOT_OWN_ACTIVITY);
      await expectNothingKept(db, store);
    });
  });

  it.each([
    ["Pegawai UPK", ["upk_staff"]],
    ["Kepala Unit", ["head_of_unit"]],
    ["Pengasuh", ["mentor"]],
    ["Penilai Mahasiswa", ["assessor"]],
    ["an account with no role", []],
  ] as const)(
    "refuses %s, even with a student record, and keeps nothing",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { student, scheduleId } = await addRecords(db);
        const store = memoryStore();

        const sent = await sendAttendancePhoto(
          db,
          store,
          { ...student, roles },
          scheduleId,
          PHOTO,
          WHILE_OPEN,
        );

        expect(sent).toEqual(PHOTO_NOT_ALLOWED);
        await expectNothingKept(db, store);
      });
    },
  );

  it("saves nothing where file keeping is off, and says photos cannot be stored yet", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);

      const sent = await sendAttendancePhoto(
        db,
        null,
        student,
        scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent).toEqual(NO_PHOTO_STORAGE);
      expect(NO_PHOTO_STORAGE.error).toContain("Foto belum dapat disimpan");
      expect(await db.select().from(activityAttendances)).toEqual([]);
    });
  });

  it("saves nothing when the file storage cannot be reached, and says to try again", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);

      const sent = await sendAttendancePhoto(
        db,
        unreachableStore(),
        student,
        scheduleId,
        PHOTO,
        WHILE_OPEN,
      );

      expect(sent).toEqual(PHOTO_NOT_KEPT);
      expect(PHOTO_NOT_KEPT.error).toBe(
        "Foto tidak dapat disimpan. Coba lagi.",
      );
      expect(await db.select().from(activityAttendances)).toEqual([]);
    });
  });

  it("keeps the first photo when it is sent again while it waits, and says the same", async () => {
    await inTestDatabase(async (db) => {
      const { student, scheduleId } = await addRecords(db);
      const store = memoryStore();
      const send = (bytes: Uint8Array, at: Date) =>
        sendAttendancePhoto(
          db,
          store,
          student,
          scheduleId,
          { name: PHOTO_FILE_NAME, bytes },
          at,
        );

      const first = await send(testPhoto(64), WHILE_OPEN);
      const second = await send(
        testPhoto(99),
        new Date("2170-10-13T04:00:00Z"),
      );

      expect(first).toEqual(SENT);
      expect(second).toEqual(SENT);
      const kept = await db.select().from(activityAttendances);
      expect(kept).toHaveLength(1);
      expect(kept[0]?.sentAt).toEqual(WHILE_OPEN);
      expect(
        [...store.files.values()].map(({ bytes }) => bytes.length),
      ).toEqual([64]);
    });
  });

  it.each(["valid", "rejected", "dispensation"] as const)(
    "refuses a photo for a schedule where the student's attendance is %s, and keeps nothing new",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { student, scheduleId, staffId } = await addRecords(db);
        const store = memoryStore();
        await addTestAttendance(db, staffId, {
          scheduleId,
          studentId: student.studentId,
          status,
        });

        const sent = await sendAttendancePhoto(
          db,
          store,
          student,
          scheduleId,
          PHOTO,
          WHILE_OPEN,
        );

        expect(sent).toEqual(ALREADY_DECIDED);
        expect(await db.select().from(activityAttendances)).toHaveLength(1);
        expect(store.files.size).toBe(0);
      });
    },
  );
});
