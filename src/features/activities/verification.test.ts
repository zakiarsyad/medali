// Sample Tahun akademik of this file: 2210 to 2210.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants, activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
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
import { readVerification, type Verification } from "./verification";
import type { StatusChoice } from "./verification-address";

/*
 * This file's own sample values: the Tahun akademik 2210, the program
 * UJIVERIFDAFTAR and the NIMs 9972700000 to 9972700099.
 */

const inTestDatabase = withTestDatabase();

/** Noon on campus on the first day of the first schedule. */
const NOW = new Date("2210-09-10T05:00:00Z");

interface Records {
  staff: AccountForAccess;
  /** Held on 10 September, the day of `NOW`, with an upload range of 1 hari. */
  firstScheduleId: string;
  /** Held on 1 September: over by `NOW`. */
  earlierScheduleId: string;
  /** Ganjil 2210, the period both schedules keep. */
  periodId: string;
  students: TestStudentAccount[];
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database, studentCount = 3): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Verifikasi", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id, {
    name: "Kegiatan uji verifikasi",
  });
  const periods = await addTestPeriods(db, 2210);
  const programId = await addTestProgram(db, "UJIVERIFDAFTAR");
  const students: TestStudentAccount[] = [];
  for (let place = 0; place < studentCount; place++) {
    const student = await addTestStudentAccount(db, programId, {
      nim: `99727000${String(place).padStart(2, "0")}`,
      name: `Mahasiswa Uji Verifikasi ${place}`,
      cohortYear: 2209,
    });
    students.push(student);
  }
  const schedule = {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
  };
  return {
    staff: accountOf(staff.id, staff.roles),
    firstScheduleId: await addTestSchedule(db, {
      ...schedule,
      startsOn: "2210-09-10",
    }),
    earlierScheduleId: await addTestSchedule(db, {
      ...schedule,
      startsOn: "2210-09-01",
    }),
    periodId: periods.oddId,
    students,
  };
}

/** A schedule of a Kegiatan tambahan on the day of `NOW`, naming nobody yet. */
async function addExtraSchedule(
  db: Database,
  records: Records,
): Promise<string> {
  const activityId = await addTestActivity(db, records.staff.id, {
    name: "Kegiatan tambahan uji verifikasi",
    semester: null,
  });
  return addTestSchedule(db, {
    activityId,
    academicPeriodId: records.periodId,
    changedBy: records.staff.id,
    startsOn: "2210-09-10",
  });
}

function studentAt(records: Records, place: number): TestStudentAccount {
  const student = records.students[place];
  if (!student) throw new Error(`There is no student ${place}.`);
  return student;
}

/** A sent photo of a student for the first schedule, a number of minutes after `NOW`. */
function addSent(
  db: Database,
  records: Records,
  place: number,
  more: Partial<Parameters<typeof addTestAttendance>[2]> = {},
): Promise<string> {
  return addTestAttendance(db, records.staff.id, {
    scheduleId: records.firstScheduleId,
    studentId: studentAt(records, place).studentId,
    status: "waiting",
    sentAt: new Date(NOW.getTime() + place * 60_000),
    photoKey: `attendance-photos/uji-verifikasi-${place}`,
    ...more,
  });
}

async function found(
  db: Database,
  records: Records,
  status: StatusChoice = "waiting",
  more: { scheduleId?: string; page?: number; keepsPhotos?: boolean } = {},
): Promise<Verification> {
  const answer = await readVerification(
    db,
    records.staff,
    {
      filters: { scheduleId: more.scheduleId ?? null, status },
      page: more.page ?? 1,
    },
    NOW,
    more.keepsPhotos ?? true,
  );
  if (answer.kind !== "found") throw new Error("The tab was refused.");
  return answer.verification;
}

describe("readVerification", () => {
  it("shows Pegawai UPK the cards that wait, the oldest first, with who sent each and for what", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const laterId = await addSent(db, records, 2);
      const firstId = await addSent(db, records, 0);

      const { list } = await found(db, records);

      expect(list.cards.map((card) => card.id)).toEqual([firstId, laterId]);
      expect(list.matching).toBe(2);
      expect(list.cards[0]).toMatchObject({
        name: "Mahasiswa Uji Verifikasi 0",
        nim: "9972700000",
        program: "UJIVERIFDAFTAR",
        activity: "Kegiatan uji verifikasi",
        sent: "Dikirim 10 Sep 2210, 12.00",
        isOutsideDates: false,
        hasPhoto: true,
        status: "waiting",
        note: "",
        decidedBy: null,
      });
    });
  });

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Penilai Mahasiswa", "assessor"],
    ["Direktur", "director"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)("refuses %s, who has no right to verify", async (_who, role) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      const other = { ...studentAt(records, 0), roles: [role] };

      const answer = await readVerification(
        db,
        other,
        { filters: { scheduleId: null, status: "all" }, page: 1 },
        NOW,
        true,
      );

      expect(answer).toEqual({ kind: "refused" });
    });
  });

  it("narrows the cards to a status, and shows every status under Semua, a dispensation among them", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 4);
      const waitingId = await addSent(db, records, 0);
      const validId = await addSent(db, records, 1, { status: "valid" });
      const rejectedId = await addSent(db, records, 2, {
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
      });
      const replacedId = await addSent(db, records, 3, {
        status: "dispensation",
        note: "Sakit. Surat dokter",
      });

      const ids = async (status: StatusChoice) =>
        (await found(db, records, status)).list.cards.map((card) => card.id);

      expect(await ids("waiting")).toEqual([waitingId]);
      expect(await ids("valid")).toEqual([validId]);
      expect(await ids("rejected")).toEqual([rejectedId]);
      expect(await ids("all")).toEqual([
        waitingId,
        validId,
        rejectedId,
        replacedId,
      ]);
    });
  });

  it("shows a decided card with its reason and the name of who decided it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, {
        status: "rejected",
        note: "Foto bukan dari kegiatan ini",
      });

      const { list } = await found(db, records, "rejected");

      expect(list.cards[0]).toMatchObject({
        status: "rejected",
        note: "Foto bukan dari kegiatan ini",
        decidedBy: "Pegawai Uji Verifikasi",
      });
    });
  });

  it("narrows the cards to one activity", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      const earlierId = await addSent(db, records, 1, {
        scheduleId: records.earlierScheduleId,
      });

      const { list } = await found(db, records, "waiting", {
        scheduleId: records.earlierScheduleId,
      });

      expect(list.cards.map((card) => card.id)).toEqual([earlierId]);
    });
  });

  it("makes no card of a record without a photo sent, nor of a removed schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, {
        status: "valid",
        sentAt: null,
        photoKey: null,
        note: "Dicatat manual.",
      });
      await addSent(db, records, 1, { scheduleId: records.earlierScheduleId });
      await db
        .update(activitySchedules)
        .set({ deletedAt: NOW, deletedBy: records.staff.id })
        .where(eq(activitySchedules.id, records.earlierScheduleId));

      const { list, choices, numbers } = await found(db, records, "all");

      expect(list.cards).toEqual([]);
      expect(list.matching).toBe(0);
      expect(choices).toEqual([]);
      expect(numbers.waiting).toBe(0);
    });
  });

  it("shows 24 cards a page, and the last page when a later one is asked for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 26);
      for (let place = 0; place < 26; place++) {
        await addSent(db, records, place);
      }

      const first = await found(db, records);
      const beyond = await found(db, records, "waiting", { page: 9 });

      expect(first.list.cards).toHaveLength(24);
      expect(first.list.matching).toBe(26);
      expect(beyond.list.page).toBe(2);
      expect(beyond.list.cards.map((card) => card.nim)).toEqual([
        "9972700024",
        "9972700025",
      ]);
    });
  });

  it("marks a photo sent on a day outside the dates of its schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, {
        sentAt: new Date("2210-09-11T05:00:00Z"),
      });

      const { list } = await found(db, records);

      expect(list.cards[0]?.isOutsideDates).toBe(true);
    });
  });

  it("shows no picture where no file is kept: without a file storage, or for an attendance without a photo", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      await addSent(db, records, 1, { photoKey: null });

      const here = await found(db, records);
      const without = await found(db, records, "waiting", {
        keepsPhotos: false,
      });

      expect(here.list.cards.map((card) => card.hasPhoto)).toEqual([
        true,
        false,
      ]);
      expect(without.list.cards.map((card) => card.hasPhoto)).toEqual([
        false,
        false,
      ]);
    });
  });

  it("counts the cards that wait, those validated today on campus, the rejected ones, and the schedules held today and open now", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 5);
      await addSent(db, records, 0);
      await addSent(db, records, 1);
      await addSent(db, records, 2, { status: "rejected" });
      // Decided at 00:30 on campus today, and at 23:30 the day before.
      await addSent(db, records, 3, {
        status: "valid",
        decidedAt: new Date("2210-09-09T17:30:00Z"),
      });
      await addSent(db, records, 4, {
        status: "valid",
        decidedAt: new Date("2210-09-09T16:30:00Z"),
      });

      const { numbers } = await found(db, records);

      expect(numbers).toEqual({
        waiting: 2,
        validToday: 1,
        rejected: 1,
        heldToday: 1,
        openNow: 1,
      });
    });
  });

  it("counts no waiting or rejected card of a student a Kegiatan tambahan no longer names, and keeps those cards in the list, marked", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const extraId = await addExtraSchedule(db, records);
      await db.insert(activityScheduleParticipants).values({
        scheduleId: extraId,
        studentId: studentAt(records, 0).studentId,
      });
      const ofExtra = { scheduleId: extraId };
      const namedId = await addSent(db, records, 0, ofExtra);
      const takenOutId = await addSent(db, records, 1, ofExtra);
      await addSent(db, records, 2, { ...ofExtra, status: "rejected" });

      const { numbers, list } = await found(db, records);
      const rejected = await found(db, records, "rejected");

      expect(numbers.waiting).toBe(1);
      expect(numbers.rejected).toBe(0);
      expect(list.cards.map((card) => [card.id, card.isMeant])).toEqual([
        [namedId, true],
        [takenOutId, false],
      ]);
      expect(rejected.list.cards.map((card) => card.isMeant)).toEqual([false]);
    });
  });

  it("counts a rejected card only while it is the student's newest attendance for the schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const later = (minutes: number) =>
        new Date(NOW.getTime() + minutes * 60_000);
      await addSent(db, records, 0, { status: "rejected" });
      await addSent(db, records, 0, {
        sentAt: later(10),
        photoKey: "attendance-photos/uji-verifikasi-0-ulang",
      });
      await addSent(db, records, 1, { status: "rejected" });
      await addSent(db, records, 1, {
        status: "valid",
        sentAt: null,
        photoKey: null,
        decidedAt: later(20),
      });
      await addSent(db, records, 2, { status: "rejected" });

      const { numbers } = await found(db, records);
      const rejected = await found(db, records, "rejected");

      expect(numbers.rejected).toBe(1);
      expect(numbers.waiting).toBe(1);
      expect(rejected.list.matching).toBe(3);
    });
  });

  it("offers the schedules that have a card, the newest first, each as its first day, its name and its semester", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, { scheduleId: records.earlierScheduleId });
      await addSent(db, records, 1);

      const { choices } = await found(db, records);

      expect(choices).toEqual([
        {
          id: records.firstScheduleId,
          words: "10 Sep 2210 · Kegiatan uji verifikasi (Semester 3)",
        },
        {
          id: records.earlierScheduleId,
          words: "1 Sep 2210 · Kegiatan uji verifikasi (Semester 3)",
        },
      ]);
    });
  });
});
