// Sample NIMs of this file: 9986209000 to 9986209099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  cancelSchedule,
  markScheduleDone,
  markScheduleMissed,
  rescheduleSchedule,
} from "./change-schedule";
import { askAnotherTime, MOVE_NOT_ALLOWED } from "./move-schedule";
import { readOwnSchedules } from "./own-schedules";
import { registerCounselling } from "./register-counselling";
import { readScheduleBoard } from "./schedule-board";
import type { ScheduleStatus } from "./schedule-ids";
import {
  ASKED_ANOTHER,
  CANCELLED,
  MARKED_DONE,
  MARKED_MISSED,
  NOT_HELD_YET,
  PICK_FROM_TOMORROW,
  PICK_WEEKDAY,
  PROPOSED,
  REGISTERED,
  SCHEDULE_CHANGED_SINCE,
  SCHEDULE_NOT_FOUND,
  TIME_PASSED,
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
  day = "2026-10-22",
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
    day,
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

const MOVED = {
  day: "2026-10-27",
  hour: "13:00",
  way: "online",
  message: "Saya ada rapat pada jam itu.",
};

describe("Ubah jadwal of Konselor on a Dijadwalkan session", () => {
  it("keeps it Dijadwalkan at the new time with the message, logged, and the student sees both", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { counsellor } = setting.people;

      const answer = await rescheduleSchedule(
        db,
        counsellor,
        setting.id,
        VERSION,
        MOVED,
        NOW,
      );

      expect(answer).toMatchObject({
        kind: "kept",
        done: PROPOSED,
        card: { status: "scheduled", day: "2026-10-27", hour: "13:00" },
      });
      expect((await logOf(db, setting.id)).at(-1)).toEqual({
        changedBy: counsellor.id,
        changedAt: NOW,
        step: "reschedule",
        statusBefore: "scheduled",
        statusAfter: "scheduled",
      });
      expect(await readOwnSchedules(db, setting.student)).toMatchObject([
        {
          status: "scheduled",
          day: "2026-10-27",
          hour: "13:00",
          way: "online",
          counsellorName: "Konselor Uji",
          counsellorMessage: "Saya ada rapat pada jam itu.",
        },
      ]);
    });
  });

  it.each([
    [{ day: "2026-10-24" }, PICK_WEEKDAY],
    [{ day: "2026-10-20", hour: "08:30" }, TIME_PASSED],
  ])("is refused for %o, changing nothing", async (wrong, error) => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const answer = await rescheduleSchedule(
        db,
        setting.people.counsellor,
        setting.id,
        VERSION,
        { ...MOVED, ...wrong },
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error });
      expect(await logOf(db, setting.id)).toHaveLength(1);
    });
  });

  it.each(["submitted", "proposed", "done", "missed", "cancelled"] as const)(
    "changes nothing on a request that is %s, giving the current card",
    async (status) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, status);

        const answer = await rescheduleSchedule(
          db,
          setting.people.counsellor,
          setting.id,
          VERSION,
          MOVED,
          NOW,
        );

        expect(answer).toMatchObject({
          kind: "changed",
          error: SCHEDULE_CHANGED_SINCE,
          card: { status },
        });
        expect(await logOf(db, setting.id)).toHaveLength(1);
      });
    },
  );
});

describe("Tandai selesai and Tidak hadir of Konselor", () => {
  it.each([
    [markScheduleDone, "done", "mark_done", MARKED_DONE],
    [markScheduleMissed, "missed", "mark_missed", MARKED_MISSED],
  ] as const)(
    "mark a Dijadwalkan session on its day, logged, and it leaves Semua yang aktif: %#",
    async (mark, status, step, done) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, "scheduled", "2026-10-20");
        const { counsellor } = setting.people;

        const answer = await mark(db, counsellor, setting.id, VERSION, NOW);

        expect(answer).toMatchObject({ kind: "kept", done, card: { status } });
        expect((await logOf(db, setting.id)).at(-1)).toEqual({
          changedBy: counsellor.id,
          changedAt: NOW,
          step,
          statusBefore: "scheduled",
          statusAfter: status,
        });
        const active = await readScheduleBoard(
          db,
          counsellor,
          { filter: "active", page: 1 },
          NOW,
        );
        expect(active?.cards).toEqual([]);
        expect(await readOwnSchedules(db, setting.student)).toEqual([]);
      });
    },
  );

  it.each([markScheduleDone, markScheduleMissed])(
    "are refused before the day of the session, changing nothing: %#",
    async (mark) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, "scheduled", "2026-10-21");

        const answer = await mark(
          db,
          setting.people.counsellor,
          setting.id,
          VERSION,
          NOW,
        );

        expect(answer).toEqual({ kind: "refused", error: NOT_HELD_YET });
        expect(await statusOf(db, setting.id)).toBe("scheduled");
        expect(await logOf(db, setting.id)).toHaveLength(1);
      });
    },
  );

  it.each(["submitted", "proposed", "done", "missed", "cancelled"] as const)(
    "change nothing on a request that is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, status, "2026-10-19");

        const answer = await markScheduleDone(
          db,
          setting.people.counsellor,
          setting.id,
          VERSION,
          NOW,
        );

        expect(answer).toMatchObject({ kind: "changed", card: { status } });
        expect(await logOf(db, setting.id)).toHaveLength(1);
      });
    },
  );
});

describe("a hand-made move or mark of a role without the right", () => {
  it.each(["student", "mentor", "head_of_unit", "discipline_officer"] as const)(
    "is refused for %s, giving nothing back",
    async (role) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db, "scheduled", "2026-10-20");
        const actor =
          role === "student"
            ? setting.student
            : { ...setting.people.counsellor, roles: [role] };
        const { id } = setting;

        expect(
          await rescheduleSchedule(db, actor, id, VERSION, MOVED, NOW),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(await markScheduleDone(db, actor, id, VERSION, NOW)).toEqual(
          MOVE_NOT_ALLOWED,
        );
        expect(await markScheduleMissed(db, actor, id, VERSION, NOW)).toEqual(
          MOVE_NOT_ALLOWED,
        );
        expect(await statusOf(db, id)).toBe("scheduled");
        expect(await logOf(db, id)).toHaveLength(1);
      });
    },
  );
});
