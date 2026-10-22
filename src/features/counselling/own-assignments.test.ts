// Sample NIMs of this file: 9986324000 to 9986324099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { ScheduleStatus } from "@/mental-health/schedule-ids";
import { cancelSchedule } from "./change-schedule";
import { askAnotherTime, MOVE_NOT_ALLOWED } from "./move-schedule";
import { readOwnHistory } from "./own-history";
import { readOwnSchedules } from "./own-schedules";
import { readScheduleBoard } from "./schedule-board";
import {
  ASKED_ANOTHER,
  NOT_FOR_THIS_KIND,
  SCHEDULE_CHANGED_SINCE,
  SCHEDULE_NOT_FOUND,
} from "./schedule-words";
import { addTestActor, addTestPeople, type TestPeople } from "./test-consents";
import {
  addTestAssignment,
  addTestSchedule,
  TEST_BASIS,
  TEST_SENDER_MESSAGE,
} from "./test-schedules";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Senin 19 and Selasa 20 October 2026.
const SENT_AT = new Date("2026-10-19T03:00:00Z");
const NOW = new Date("2026-10-20T03:00:00Z");

const VERSION = SENT_AT.toISOString();

const ANOTHER = { day: "2026-10-27", hour: "13:00", reason: "Bentrok uji." };

interface Setting {
  people: TestPeople;
  student: AccountForAccess;
  other: AccountForAccess;
  sender: AccountForAccess;
  id: string;
}

/** Two students, the first with a Penugasan in `status`. */
async function setUp(
  db: Database,
  status: ScheduleStatus = "scheduled",
): Promise<Setting> {
  const people = await addTestPeople(db, "Prodi Uji Konseling Wajib", [
    "9986324001",
    "9986324002",
  ]);
  const [student, other] = people.students;
  if (!student?.studentId || !other) throw new Error("Student missing.");
  const sender = await addTestActor(db, "Pembina Uji", ["discipline_officer"]);
  const id = await addTestAssignment(db, {
    studentId: student.studentId,
    senderId: sender.id,
    status,
    counsellorId: status === "awaiting" ? null : people.counsellor.id,
    at: SENT_AT,
  });
  return { people, student, other, sender, id };
}

function logOf(db: Database, id: string) {
  return db
    .select({
      changedBy: counsellingScheduleChanges.changedBy,
      step: counsellingScheduleChanges.step,
      statusBefore: counsellingScheduleChanges.statusBefore,
      statusAfter: counsellingScheduleChanges.statusAfter,
    })
    .from(counsellingScheduleChanges)
    .where(eq(counsellingScheduleChanges.scheduleId, id))
    .orderBy(asc(counsellingScheduleChanges.changedAt));
}

async function statusOf(db: Database, id: string) {
  const [kept] = await db
    .select({ status: counsellingSchedules.status })
    .from(counsellingSchedules)
    .where(eq(counsellingSchedules.id, id));
  return kept?.status;
}

describe("the student's own assignments", () => {
  it("show under Jadwal konseling saya with the Jenis and the Topik, never Dasar or Pesan pengirim", async () => {
    await inTestDatabase(async (db) => {
      const { student, id } = await setUp(db, "awaiting");

      const own = await readOwnSchedules(db, student);

      expect(own).toEqual([
        {
          id,
          kind: "assigned",
          status: "awaiting",
          topic: "discipline_violation",
          day: null,
          hour: null,
          way: null,
          counsellorName: null,
          counsellorMessage: null,
          version: VERSION,
        },
      ]);
      const sent = JSON.stringify(own);
      expect(sent).not.toContain(TEST_BASIS);
      expect(sent).not.toContain(TEST_SENDER_MESSAGE);
    });
  });

  it("stand beside an active voluntary request", async () => {
    await inTestDatabase(async (db) => {
      const { student } = await setUp(db, "awaiting");
      if (!student.studentId) throw new Error("Student missing.");
      await addTestSchedule(db, {
        studentId: student.studentId,
        studentAccountId: student.id,
        at: NOW,
      });

      const own = await readOwnSchedules(db, student);

      expect(own.map((schedule) => schedule.kind)).toEqual([
        "voluntary",
        "assigned",
      ]);
    });
  });

  it("move to Riwayat once Selesai or Tidak hadir, with their Jenis", async () => {
    await inTestDatabase(async (db) => {
      const { student, id } = await setUp(db, "missed");

      expect(await readOwnSchedules(db, student)).toEqual([]);
      expect(await readOwnHistory(db, student, 10)).toEqual({
        items: [
          {
            id,
            kind: "assigned",
            status: "missed",
            day: "2026-10-22",
            topic: "discipline_violation",
          },
        ],
        hasMore: false,
      });
    });
  });

  it.each([
    "head_of_unit",
    "discipline_officer",
    "assessor",
    "counsellor",
  ] as const)("are read by no %s as their own", async (role) => {
    await inTestDatabase(async (db) => {
      const { student } = await setUp(db, "awaiting");

      expect(await readOwnSchedules(db, { ...student, roles: [role] })).toEqual(
        [],
      );
    });
  });
});

describe("Minta jadwal ulang on an assignment", () => {
  it("makes it Minta jadwal ulang at the time asked, logged, shown to Konselor first with the reason", async () => {
    await inTestDatabase(async (db) => {
      const { people, student, sender, id } = await setUp(db);
      const [, otherId] = people.studentIds;
      if (!otherId) throw new Error("Student missing.");
      await addTestAssignment(db, { studentId: otherId, senderId: sender.id });
      await db
        .update(counsellingSchedules)
        .set({ counsellorMessage: "Pesan konselor uji." })
        .where(eq(counsellingSchedules.id, id));

      const answer = await askAnotherTime(
        db,
        student,
        id,
        VERSION,
        ANOTHER,
        NOW,
      );

      expect(answer).toEqual({ kind: "kept", done: ASKED_ANOTHER });
      expect((await logOf(db, id)).at(-1)).toEqual({
        changedBy: student.id,
        step: "ask_another",
        statusBefore: "scheduled",
        statusAfter: "reschedule_asked",
      });
      const board = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );
      expect(board?.cards[0]).toMatchObject({
        id,
        status: "reschedule_asked",
        day: "2026-10-27",
        hour: "13:00",
        reason: "Bentrok uji.",
      });
      expect(await readOwnSchedules(db, student)).toMatchObject([
        {
          status: "reschedule_asked",
          day: "2026-10-27",
          counsellorName: null,
          counsellorMessage: null,
        },
      ]);
    });
  });

  it("is refused while it waits for its time, with the current state", async () => {
    await inTestDatabase(async (db) => {
      const { student, id } = await setUp(db, "awaiting");

      const answer = await askAnotherTime(
        db,
        student,
        id,
        VERSION,
        ANOTHER,
        NOW,
      );

      expect(answer).toEqual({
        kind: "changed",
        error: SCHEDULE_CHANGED_SINCE,
      });
      expect(await logOf(db, id)).toHaveLength(1);
    });
  });

  it("is not found for another student", async () => {
    await inTestDatabase(async (db) => {
      const { other, id } = await setUp(db);

      const answer = await askAnotherTime(db, other, id, VERSION, ANOTHER, NOW);

      expect(answer).toEqual({ kind: "refused", error: SCHEDULE_NOT_FOUND });
      expect(await statusOf(db, id)).toBe("scheduled");
    });
  });

  it.each([
    "head_of_unit",
    "discipline_officer",
    "assessor",
    "counsellor",
  ] as const)("is refused for %s, changing nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { student, id } = await setUp(db);

      const answer = await askAnotherTime(
        db,
        { ...student, roles: [role] },
        id,
        VERSION,
        ANOTHER,
        NOW,
      );

      expect(answer).toEqual(MOVE_NOT_ALLOWED);
      expect(await logOf(db, id)).toHaveLength(1);
    });
  });
});

describe("cancelling an assignment by hand", () => {
  it.each(["awaiting", "scheduled", "reschedule_asked"] as const)(
    "is refused for the student while it is %s, changing nothing",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { student, id } = await setUp(db, status);

        const answer = await cancelSchedule(db, student, id, VERSION, NOW);

        expect(answer).toEqual({ kind: "refused", error: NOT_FOR_THIS_KIND });
        expect(await statusOf(db, id)).toBe(status);
        expect(await logOf(db, id)).toHaveLength(1);
      });
    },
  );

  it.each(["head_of_unit", "discipline_officer", "assessor"] as const)(
    "is refused for %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { sender, id } = await setUp(db);

        const answer = await cancelSchedule(
          db,
          { ...sender, roles: [role] },
          id,
          VERSION,
          NOW,
        );

        expect(answer).toEqual(MOVE_NOT_ALLOWED);
        expect(await statusOf(db, id)).toBe("scheduled");
      });
    },
  );
});
