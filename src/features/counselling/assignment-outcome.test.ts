// Sample NIMs of this file: 9986325000 to 9986325099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { markScheduleDone, markScheduleMissed } from "./change-schedule";
import { askAnotherTime, MOVE_NOT_ALLOWED } from "./move-schedule";
import { readOwnHistory } from "./own-history";
import { readOwnSchedules } from "./own-schedules";
import { readScheduleBoard } from "./schedule-board";
import { readScheduleSession } from "./schedule-session";
import {
  MARKED_DONE,
  MARKED_MISSED,
  NOT_HELD_YET,
  SCHEDULE_CHANGED_SINCE,
} from "./schedule-words";
import { setScheduleTime } from "./set-schedule-time";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestAssignment } from "./test-schedules";
import { addConsentedPeople } from "./test-sessions";

const inTestDatabase = withTestDatabase();

// Kamis 22 October 2026, 15:00 on campus: after a session at 10:00.
const SENT_AT = new Date("2026-10-19T03:00:00Z");
const NOW = new Date("2026-10-22T08:00:00Z");

const VERSION = SENT_AT.toISOString();

/** A student with a Dijadwalkan Penugasan on Kamis 22 October. */
async function setUp(db: Database, nim: string, consented: boolean) {
  const add = consented ? addConsentedPeople : addTestPeople;
  const people = await add(db, `Prodi Uji Hasil Wajib ${nim}`, [nim]);
  const [student] = people.students;
  if (!student?.studentId) throw new Error("Student missing.");
  const sender = await addTestActor(db, "Pembina Uji", ["discipline_officer"]);
  const id = await addTestAssignment(db, {
    studentId: student.studentId,
    senderId: sender.id,
    status: "scheduled",
    day: "2026-10-22",
    counsellorId: people.counsellor.id,
    at: SENT_AT,
  });
  return { ...people, student, sender, id };
}

function stepsOf(db: Database, id: string) {
  return db
    .select({
      step: counsellingScheduleChanges.step,
      statusBefore: counsellingScheduleChanges.statusBefore,
      statusAfter: counsellingScheduleChanges.statusAfter,
    })
    .from(counsellingScheduleChanges)
    .where(eq(counsellingScheduleChanges.scheduleId, id))
    .orderBy(asc(counsellingScheduleChanges.changedAt));
}

describe("Tandai selesai on an assignment", () => {
  it("makes it Selesai, logged, and moves it to the student's Riwayat", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, student, id } = await setUp(db, "9986325001", true);

      const answer = await markScheduleDone(db, counsellor, id, VERSION, NOW);

      expect(answer).toMatchObject({
        kind: "kept",
        done: MARKED_DONE,
        card: { status: "done" },
      });
      expect((await stepsOf(db, id)).at(-1)).toEqual({
        step: "mark_done",
        statusBefore: "scheduled",
        statusAfter: "done",
      });
      expect(await readOwnSchedules(db, student)).toEqual([]);
      expect((await readOwnHistory(db, student, 10)).items).toMatchObject([
        { id, kind: "assigned", status: "done" },
      ]);
    });
  });

  it("opens Catat sesi for its student while the consent is Disetujui", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, id } = await setUp(db, "9986325002", true);
      await markScheduleDone(db, counsellor, id, VERSION, NOW);

      expect(await readScheduleSession(db, counsellor, id)).toMatchObject({
        kind: "open",
        start: { scheduleId: id, day: "2026-10-22" },
      });
    });
  });

  it("is still kept without consent, but opens no session, saying consent is needed first", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, id } = await setUp(db, "9986325003", false);

      const answer = await markScheduleDone(db, counsellor, id, VERSION, NOW);

      expect(answer).toMatchObject({ kind: "kept" });
      expect(await readScheduleSession(db, counsellor, id)).toEqual({
        kind: "needs_consent",
      });
    });
  });

  it("is refused before the day of the session", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, id } = await setUp(db, "9986325004", true);
      const before = new Date("2026-10-21T03:00:00Z");

      const answer = await markScheduleDone(
        db,
        counsellor,
        id,
        VERSION,
        before,
      );

      expect(answer).toEqual({ kind: "refused", error: NOT_HELD_YET });
      expect(await stepsOf(db, id)).toHaveLength(1);
    });
  });
});

describe("Tidak hadir on an assignment", () => {
  it("makes it Tidak hadir, logged, in the student's Riwayat, and leaves nothing more to do here", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, student, id } = await setUp(db, "9986325005", true);

      const answer = await markScheduleMissed(db, counsellor, id, VERSION, NOW);

      expect(answer).toMatchObject({ kind: "kept", done: MARKED_MISSED });
      expect((await readOwnHistory(db, student, 10)).items).toMatchObject([
        { id, kind: "assigned", status: "missed" },
      ]);
      const version = NOW.toISOString();
      const asked = await askAnotherTime(
        db,
        student,
        id,
        version,
        { day: "2026-10-26", hour: "08:30", reason: null },
        NOW,
      );
      const set = await setScheduleTime(
        db,
        counsellor,
        id,
        version,
        { day: "2026-10-26", hour: "08:30", way: "online", message: null },
        NOW,
      );
      expect(asked).toEqual({ kind: "changed", error: SCHEDULE_CHANGED_SINCE });
      expect(set).toMatchObject({
        kind: "changed",
        card: { status: "missed" },
      });
      expect(await stepsOf(db, id)).toHaveLength(2);
    });
  });
});

describe("marking an assignment by hand", () => {
  it.each([
    "student",
    "discipline_officer",
    "assessor",
    "head_of_unit",
  ] as const)("is refused for %s, changing nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { student, id } = await setUp(db, "9986325006", true);
      const other = { ...student, roles: [role] };

      expect(await markScheduleDone(db, other, id, VERSION, NOW)).toEqual(
        MOVE_NOT_ALLOWED,
      );
      expect(await markScheduleMissed(db, other, id, VERSION, NOW)).toEqual(
        MOVE_NOT_ALLOWED,
      );
      expect(await stepsOf(db, id)).toHaveLength(1);
    });
  });
});

describe("the consent on an assignment card of Konselor", () => {
  it.each([
    [true, "9986325007"],
    [false, "9986325008"],
  ] as const)("is given as Disetujui: %s", async (consented, nim) => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await setUp(db, nim, consented);

      const board = await readScheduleBoard(
        db,
        counsellor,
        { filter: "scheduled", page: 1 },
        NOW,
      );

      expect(board?.cards).toMatchObject([{ hasConsent: consented }]);
    });
  });
});
