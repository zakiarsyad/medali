// Sample NIMs of this file: 9986209000 to 9986209099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelSchedule } from "./change-schedule";
import { askAnotherTime, MOVE_NOT_ALLOWED } from "./move-schedule";
import { readOwnSchedules } from "./own-schedules";
import { registerCounselling } from "./register-counselling";
import { readScheduleBoard } from "./schedule-board";
import type { ScheduleStatus } from "./schedule-ids";
import {
  ASKED_ANOTHER,
  CANCELLED,
  PICK_FROM_TOMORROW,
  REGISTERED,
  SCHEDULE_CHANGED_SINCE,
  SCHEDULE_NOT_FOUND,
  WEEKDAYS_ONLY,
} from "./schedule-words";
import { addTestPeople, type TestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Senin 19 and Selasa 20 October 2026.
const REGISTERED_AT = new Date("2026-10-19T03:00:00Z");
const NOW = new Date("2026-10-20T03:00:00Z");

const VERSION = REGISTERED_AT.toISOString();

const ANOTHER = { day: "2026-10-26", hour: "08:30", reason: "Bentrok uji." };

interface Setting {
  people: TestPeople;
  student: AccountForAccess;
  other: AccountForAccess;
  id: string;
}

/**
 * Two students, the first with a request for Kamis 22 October in
 * `status`, taken by the test Konselor once it is past Diajukan.
 */
async function setUp(
  db: Database,
  status: ScheduleStatus = "scheduled",
): Promise<Setting> {
  const people = await addTestPeople(db, "Prodi Uji Ubah Jadwal", [
    "9986209001",
    "9986209002",
  ]);
  const [student, other] = people.students;
  if (!student?.studentId || !other) throw new Error("Student missing.");
  const id = await addTestSchedule(db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    status,
    day: "2026-10-22",
    counsellorId: status === "submitted" ? null : people.counsellor.id,
    at: REGISTERED_AT,
  });
  return { people, student, other, id };
}

function logOf(db: Database, id: string) {
  return db
    .select({
      changedBy: counsellingScheduleChanges.changedBy,
      changedAt: counsellingScheduleChanges.changedAt,
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

describe("Minta jadwal ulang on a Dijadwalkan session", () => {
  it("sends it back to Diajukan at the new time, logged, with the Alasan shown to Konselor", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const answer = await askAnotherTime(
        db,
        setting.student,
        setting.id,
        VERSION,
        ANOTHER,
        NOW,
      );

      expect(answer).toEqual({ kind: "kept", done: ASKED_ANOTHER });
      expect((await logOf(db, setting.id)).at(-1)).toEqual({
        changedBy: setting.student.id,
        changedAt: NOW,
        step: "ask_another",
        statusBefore: "scheduled",
        statusAfter: "submitted",
      });
      const board = await readScheduleBoard(
        db,
        setting.people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );
      expect(board?.cards).toMatchObject([
        {
          status: "submitted",
          day: "2026-10-26",
          hour: "08:30",
          reason: "Bentrok uji.",
        },
      ]);
    });
  });

  it.each([
    ["2026-10-20", PICK_FROM_TOMORROW],
    ["2026-10-24", WEEKDAYS_ONLY],
  ])("is refused for %s, changing nothing", async (day, error) => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const answer = await askAnotherTime(
        db,
        setting.student,
        setting.id,
        VERSION,
        { ...ANOTHER, day },
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error });
      expect(await statusOf(db, setting.id)).toBe("scheduled");
      expect(await logOf(db, setting.id)).toHaveLength(1);
    });
  });
});

describe("Batalkan pendaftaran and Batalkan", () => {
  it.each(["submitted", "proposed", "scheduled"] as const)(
    "make a %s request Dibatalkan, logged as the student's, and kept",
    async (status) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, status);

        const answer = await cancelSchedule(
          db,
          setting.student,
          setting.id,
          VERSION,
          NOW,
        );

        expect(answer).toEqual({ kind: "kept", done: CANCELLED });
        expect(await statusOf(db, setting.id)).toBe("cancelled");
        expect((await logOf(db, setting.id)).at(-1)).toEqual({
          changedBy: setting.student.id,
          changedAt: NOW,
          step: "cancel",
          statusBefore: status,
          statusAfter: "cancelled",
        });
        expect(await readOwnSchedules(db, setting.student)).toEqual([]);
      });
    },
  );

  it("lets the student register again once it is Dibatalkan", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await cancelSchedule(db, setting.student, setting.id, VERSION, NOW);

      const again = await registerCounselling(
        db,
        setting.student,
        {
          topic: "family",
          day: "2026-10-23",
          hour: "10:00",
          way: "online",
          story: null,
          consented: true,
        },
        NOW,
      );

      expect(again).toEqual({ kind: "kept", done: REGISTERED });
    });
  });

  it.each(["done", "missed", "cancelled"] as const)(
    "change nothing on a request that is already %s, telling its current state",
    async (status) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, status);

        const cancelled = await cancelSchedule(
          db,
          setting.student,
          setting.id,
          VERSION,
          NOW,
        );
        const asked = await askAnotherTime(
          db,
          setting.student,
          setting.id,
          VERSION,
          ANOTHER,
          NOW,
        );

        const changed = { kind: "changed", error: SCHEDULE_CHANGED_SINCE };
        expect(cancelled).toEqual(changed);
        expect(asked).toEqual(changed);
        expect(await statusOf(db, setting.id)).toBe(status);
        expect(await logOf(db, setting.id)).toHaveLength(1);
      });
    },
  );

  it("cannot be done to the request of another student, who gets nothing back", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const cancelled = await cancelSchedule(
        db,
        setting.other,
        setting.id,
        VERSION,
        NOW,
      );
      const asked = await askAnotherTime(
        db,
        setting.other,
        setting.id,
        VERSION,
        ANOTHER,
        NOW,
      );

      const notFound = { kind: "refused", error: SCHEDULE_NOT_FOUND };
      expect(cancelled).toEqual(notFound);
      expect(asked).toEqual(notFound);
      expect(await statusOf(db, setting.id)).toBe("scheduled");
    });
  });

  it.each([
    "counsellor",
    "head_of_unit",
    "mentor",
    "discipline_officer",
  ] as const)(
    "is refused for %s in a hand-made request, giving nothing back",
    async (role) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db);
        const other = { ...setting.student, roles: [role] };

        expect(
          await cancelSchedule(db, other, setting.id, VERSION, NOW),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(await statusOf(db, setting.id)).toBe("scheduled");
      });
    },
  );
});
