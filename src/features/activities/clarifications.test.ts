import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activitySchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { ClarificationChoice } from "./clarification-list-address";
import { type Clarifications, readClarifications } from "./clarifications";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2330, the program
 * UJIKLARDAFTAR and the NIMs 9974000000 to 9974000099.
 */

const inTestDatabase = withTestDatabase();

/** Noon on campus on 12 September. */
const SENT_AT = new Date("2330-09-12T05:00:00Z");

interface Records {
  assessor: AccountForAccess;
  /** Held on 10 and 11 September, 07:30 to 11:30. */
  scheduleId: string;
  /** Held on 1 September. */
  earlierScheduleId: string;
  students: TestStudentAccount[];
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database, studentCount = 3): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Klarifikasi", [
    "assessor",
  ]);
  const activityId = await addTestActivity(db, assessor.id, {
    name: "Kegiatan uji klarifikasi",
  });
  const periods = await addTestPeriods(db, 2330);
  const programId = await addTestProgram(db, "UJIKLARDAFTAR");
  const students: TestStudentAccount[] = [];
  for (let place = 0; place < studentCount; place++) {
    const student = await addTestStudentAccount(db, programId, {
      nim: `99740000${String(place).padStart(2, "0")}`,
      name: `Mahasiswa Uji Klarifikasi ${place}`,
      cohortYear: 2329,
    });
    students.push(student);
  }
  const schedule = {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: assessor.id,
  };
  return {
    assessor: accountOf(assessor.id, assessor.roles),
    scheduleId: await addTestSchedule(db, {
      ...schedule,
      startsOn: "2330-09-10",
      endsOn: "2330-09-11",
    }),
    earlierScheduleId: await addTestSchedule(db, {
      ...schedule,
      startsOn: "2330-09-01",
    }),
    students,
  };
}

function studentAt(records: Records, place: number): TestStudentAccount {
  const student = records.students[place];
  if (!student) throw new Error(`There is no student ${place}.`);
  return student;
}

/** A clarification of a student for the first schedule, minutes after `SENT_AT`. */
function addSent(
  db: Database,
  records: Records,
  place: number,
  more: Partial<Parameters<typeof addTestClarification>[2]> = {},
): Promise<string> {
  return addTestClarification(db, records.assessor.id, {
    scheduleId: records.scheduleId,
    studentId: studentAt(records, place).studentId,
    status: "submitted",
    sentAt: new Date(SENT_AT.getTime() + place * 60_000),
    ...more,
  });
}

async function read(
  db: Database,
  account: AccountForAccess,
  more: { status?: ClarificationChoice; query?: string; page?: number } = {},
  keepsFiles = true,
): Promise<Clarifications> {
  const answer = await readClarifications(
    db,
    account,
    {
      filters: { status: more.status ?? "submitted", query: more.query ?? "" },
      page: more.page ?? 1,
    },
    keepsFiles,
  );
  if (answer.kind !== "found") throw new Error("The account was refused.");
  return answer.clarifications;
}

function namesOf(clarifications: Clarifications): string[] {
  return clarifications.list.cards.map((card) => card.name);
}

describe("readClarifications", () => {
  it("gives Penilai Mahasiswa the cards", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);

      const shown = await read(db, records.assessor);

      expect(namesOf(shown)).toEqual(["Mahasiswa Uji Klarifikasi 0"]);
    });
  });

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Pegawai UPK", "upk_staff"],
    ["Direktur / Wakil Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)("refuses %s before anything is read", async (_who, role) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      const student = studentAt(records, 0);

      const answer = await readClarifications(
        db,
        { ...student, roles: [role] },
        { filters: { status: "all", query: "" }, page: 1 },
        true,
      );

      expect(answer).toEqual({ kind: "refused" });
    });
  });

  it("shows on a card the student, the activity with its days and hours, the reason, the explanation, the file, when it was sent, and nothing decided while it waits", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addSent(db, records, 0, {
        reason: "campus_duty",
        explanation: "Mewakili kampus pada lomba uji.",
        fileKey: "attendance-clarifications/uji-kartu.pdf",
        fileName: "surat-tugas.pdf",
        fileSize: 20_480,
      });

      const shown = await read(db, records.assessor);

      expect(shown.list.cards).toEqual([
        {
          id,
          sentAt: "2330-09-12T05:00:00.000Z",
          name: "Mahasiswa Uji Klarifikasi 0",
          nim: "9974000000",
          program: "UJIKLARDAFTAR",
          activity: "Kegiatan uji klarifikasi",
          held: "10 Sep – 11 Sep 2330, 07:30–11:30",
          reason: "Tugas institusi atau lomba",
          status: "submitted",
          sent: "12 Sep 2330, 12.00",
          decision: null,
          explanation: "Mewakili kampus pada lomba uji.",
          file: {
            name: "surat-tugas.pdf",
            isPdf: true,
            facts: "Dokumen PDF · 20 KB",
          },
        },
      ]);
    });
  });

  it("shows a picture as Gambar, and no file for one that was never kept or where file keeping is off", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, {
        fileKey: "attendance-clarifications/uji-gambar.jpg",
        fileName: "foto-surat.jpg",
        fileContentType: "image/jpeg",
        fileSize: 300,
      });
      await addSent(db, records, 1);

      const kept = await read(db, records.assessor);
      const notKept = await read(db, records.assessor, {}, false);

      expect(kept.list.cards.map((card) => card.file)).toEqual([
        null,
        { name: "foto-surat.jpg", isPdf: false, facts: "Gambar · 1 KB" },
      ]);
      expect(notKept.list.cards.map((card) => card.file)).toEqual([null, null]);
    });
  });

  it("says how a decided one was decided, with the note when there is one, by whom and when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0, { status: "accepted" });
      await addSent(db, records, 1, {
        status: "accepted",
        acceptedAs: "dispensation",
        note: "Surat sesuai tanggal kegiatan.",
      });
      await addSent(db, records, 2, {
        status: "rejected",
        note: "Lampiran tidak terbaca.",
      });

      const shown = await read(db, records.assessor, { status: "all" });

      const by = "(Penilai Uji Klarifikasi, 11 Sep 2150, 10.00)";
      expect(shown.list.cards.map((card) => card.decision)).toEqual([
        { result: "Ditolak: Lampiran tidak terbaca.", by },
        {
          result: "Diterima sebagai dispensasi: Surat sesuai tanggal kegiatan.",
          by,
        },
        { result: "Diterima sebagai hadir", by },
      ]);
    });
  });

  it("starts at the ones that wait, the newest first, and narrows to each status or to every status", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 4);
      await addSent(db, records, 0);
      await addSent(db, records, 1, { status: "accepted" });
      await addSent(db, records, 2, { status: "rejected", note: "Uji." });
      await addSent(db, records, 3);
      const { assessor } = records;

      const name = (place: number) => `Mahasiswa Uji Klarifikasi ${place}`;
      expect(namesOf(await read(db, assessor))).toEqual([name(3), name(0)]);
      expect(namesOf(await read(db, assessor, { status: "accepted" }))).toEqual(
        [name(1)],
      );
      expect(namesOf(await read(db, assessor, { status: "rejected" }))).toEqual(
        [name(2)],
      );
      expect(namesOf(await read(db, assessor, { status: "all" }))).toEqual([
        name(3),
        name(2),
        name(1),
        name(0),
      ]);
    });
  });

  it("finds by a part of the name or of the NIM, whatever its capitals, and takes the signs of a pattern as written", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      await addSent(db, records, 1);
      const { assessor } = records;

      const byName = await read(db, assessor, { query: "uji klarifikasi 1" });
      const byNim = await read(db, assessor, { query: "974000000" });
      const bySign = await read(db, assessor, { query: "%" });

      expect(namesOf(byName)).toEqual(["Mahasiswa Uji Klarifikasi 1"]);
      expect(namesOf(byNim)).toEqual(["Mahasiswa Uji Klarifikasi 0"]);
      expect(bySign.list).toEqual({ cards: [], matching: 0, page: 1 });
    });
  });

  it("counts every clarification by its status, whatever the filters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 4);
      const before = (await read(db, records.assessor)).counts;
      await addSent(db, records, 0);
      await addSent(db, records, 1);
      await addSent(db, records, 2, { status: "accepted" });
      await addSent(db, records, 3, { status: "rejected", note: "Uji." });

      const shown = await read(db, records.assessor, {
        status: "rejected",
        query: "tidak ada yang cocok",
      });

      expect(shown.list.matching).toBe(0);
      expect(shown.counts).toEqual({
        submitted: before.submitted + 2,
        accepted: before.accepted + 1,
        rejected: before.rejected + 1,
      });
    });
  });

  it("leaves out the clarification of a removed schedule: not shown and not counted", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 0);
      await addSent(db, records, 1, { scheduleId: records.earlierScheduleId });
      const before = (await read(db, records.assessor)).counts;
      await db
        .update(activitySchedules)
        .set({ deletedAt: new Date(), deletedBy: records.assessor.id })
        .where(eq(activitySchedules.id, records.earlierScheduleId));

      const shown = await read(db, records.assessor, { query: "9974000" });

      expect(namesOf(shown)).toEqual(["Mahasiswa Uji Klarifikasi 0"]);
      expect(shown.counts.submitted).toBe(before.submitted - 1);
    });
  });

  it("shows 20 cards a page, and the last page there is when a later one is asked for", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db, 22);
      for (let place = 0; place < 22; place++) {
        await addSent(db, records, place);
      }
      const { assessor } = records;
      const query = "Mahasiswa Uji Klarifikasi";

      const first = await read(db, assessor, { query });
      const second = await read(db, assessor, { query, page: 2 });
      const beyond = await read(db, assessor, { query, page: 9 });

      expect(first.list.cards).toHaveLength(20);
      expect(first.list.cards[0]?.name).toBe("Mahasiswa Uji Klarifikasi 21");
      expect(first.list).toMatchObject({ matching: 22, page: 1 });
      expect(namesOf(second)).toEqual([
        "Mahasiswa Uji Klarifikasi 1",
        "Mahasiswa Uji Klarifikasi 0",
      ]);
      expect(beyond.list.page).toBe(2);
      expect(beyond.askedPage).toBe(9);
      expect(namesOf(beyond)).toEqual(namesOf(second));
    });
  });
});
