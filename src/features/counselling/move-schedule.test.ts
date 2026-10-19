// Sample NIMs of this file: 9986206000 to 9986206099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  acceptSchedule,
  approveSchedule,
  askAnotherTime,
  MOVE_NOT_ALLOWED,
  proposeSchedule,
} from "./move-schedule";
import { readOwnSchedules } from "./own-schedules";
import { readScheduleBoard } from "./schedule-board";
import {
  ACCEPTED,
  APPROVED,
  ASKED_ANOTHER,
  PICK_FROM_TOMORROW,
  PICK_WEEKDAY,
  PROPOSED,
  SCHEDULE_CHANGED_SINCE,
  SCHEDULE_NOT_FOUND,
  TIME_PASSED,
  WISHED_TIME_PASSED,
} from "./schedule-words";
import { addTestPeople, type TestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Senin 19 and Selasa 20 October 2026.
const REGISTERED_AT = new Date("2026-10-19T03:00:00Z");
const NOW = new Date("2026-10-20T03:00:00Z");
const LATER = new Date("2026-10-20T04:00:00Z");

const VERSION = REGISTERED_AT.toISOString();

const PROPOSAL = {
  day: "2026-10-23",
  hour: "14:30",
  way: "online",
  message: "Pesan uji.",
};

const ANOTHER = { day: "2026-10-26", hour: "08:30", reason: "Bentrok uji." };

interface Setting {
  people: TestPeople;
  student: AccountForAccess;
  other: AccountForAccess;
  id: string;
}

/** Two students, the first with a Diajukan request for Rabu 21 October. */
async function setUp(db: Database, day = "2026-10-21"): Promise<Setting> {
  const people = await addTestPeople(db, "Prodi Uji Jadwal Langkah", [
    "9986206001",
    "9986206002",
  ]);
  const [student, other] = people.students;
  if (!student?.studentId || !other) throw new Error("Student missing.");
  const id = await addTestSchedule(db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    day,
    at: REGISTERED_AT,
  });
  return { people, student, other, id };
}

function logOf(db: Database) {
  return db
    .select({
      changedBy: counsellingScheduleChanges.changedBy,
      changedAt: counsellingScheduleChanges.changedAt,
      step: counsellingScheduleChanges.step,
      statusBefore: counsellingScheduleChanges.statusBefore,
      statusAfter: counsellingScheduleChanges.statusAfter,
    })
    .from(counsellingScheduleChanges)
    .orderBy(asc(counsellingScheduleChanges.changedAt));
}

async function statusOf(db: Database, id: string) {
  const [kept] = await db
    .select({ status: counsellingSchedules.status })
    .from(counsellingSchedules)
    .where(eq(counsellingSchedules.id, id));
  return kept?.status;
}

/** Konselor proposes another time, and gives the version the student sees. */
async function propose(db: Database, setting: Setting): Promise<string> {
  const proposed = await proposeSchedule(
    db,
    setting.people.counsellor,
    setting.id,
    VERSION,
    PROPOSAL,
    NOW,
  );
  if (proposed.kind !== "kept") throw new Error(proposed.error);
  return proposed.card.version;
}

describe("Setujui waktu ini", () => {
  it("makes a Diajukan request Dijadwalkan with Konselor's name, logged, and the student sees it", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { counsellor } = setting.people;

      const answer = await approveSchedule(
        db,
        counsellor,
        setting.id,
        VERSION,
        NOW,
      );

      expect(answer).toMatchObject({
        kind: "kept",
        done: APPROVED,
        card: {
          status: "scheduled",
          counsellorName: "Konselor Uji",
          day: "2026-10-21",
        },
      });
      expect((await logOf(db)).at(-1)).toEqual({
        changedBy: counsellor.id,
        changedAt: NOW,
        step: "approve",
        statusBefore: "submitted",
        statusAfter: "scheduled",
      });
      expect(await readOwnSchedules(db, setting.student)).toMatchObject([
        { status: "scheduled", counsellorName: "Konselor Uji" },
      ]);
    });
  });

  it("is refused when the time asked has passed, changing nothing", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db, "2026-10-20");

      const answer = await approveSchedule(
        db,
        setting.people.counsellor,
        setting.id,
        VERSION,
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error: WISHED_TIME_PASSED });
      expect(await statusOf(db, setting.id)).toBe("submitted");
      expect(await logOf(db)).toHaveLength(1);
    });
  });

  it("pressed twice keeps one change: the second is refused with the current card", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const { counsellor } = setting.people;
      await approveSchedule(db, counsellor, setting.id, VERSION, NOW);

      const again = await approveSchedule(
        db,
        counsellor,
        setting.id,
        VERSION,
        LATER,
      );

      expect(again).toMatchObject({
        kind: "changed",
        error: SCHEDULE_CHANGED_SINCE,
        card: { status: "scheduled" },
      });
      expect(await logOf(db)).toHaveLength(2);
    });
  });
});

describe("Usulkan waktu lain", () => {
  it("makes a Diajukan request Usulan jadwal lain at the time sent, and the student sees it with the message", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const answer = await proposeSchedule(
        db,
        setting.people.counsellor,
        setting.id,
        VERSION,
        PROPOSAL,
        NOW,
      );

      expect(answer).toMatchObject({
        kind: "kept",
        done: PROPOSED,
        card: {
          status: "proposed",
          day: "2026-10-23",
          hour: "14:30",
          way: "online",
        },
      });
      expect((await logOf(db)).at(-1)).toMatchObject({
        step: "propose",
        statusBefore: "submitted",
        statusAfter: "proposed",
      });
      expect(await readOwnSchedules(db, setting.student)).toMatchObject([
        {
          status: "proposed",
          day: "2026-10-23",
          counsellorMessage: "Pesan uji.",
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

      const answer = await proposeSchedule(
        db,
        setting.people.counsellor,
        setting.id,
        VERSION,
        { ...PROPOSAL, ...wrong },
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error });
      expect(await statusOf(db, setting.id)).toBe("submitted");
    });
  });
});

describe("Terima jadwal ini and Minta waktu lain", () => {
  it("Terima jadwal ini makes a proposal Dijadwalkan, logged as the student's", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const version = await propose(db, setting);

      const answer = await acceptSchedule(
        db,
        setting.student,
        setting.id,
        version,
        LATER,
      );

      expect(answer).toEqual({ kind: "kept", done: ACCEPTED });
      expect(await readOwnSchedules(db, setting.student)).toMatchObject([
        {
          status: "scheduled",
          day: "2026-10-23",
          counsellorName: "Konselor Uji",
        },
      ]);
      expect((await logOf(db)).at(-1)).toEqual({
        changedBy: setting.student.id,
        changedAt: LATER,
        step: "accept",
        statusBefore: "proposed",
        statusAfter: "scheduled",
      });
    });
  });

  it("Minta waktu lain sends it back to Diajukan at the new time, with the reason shown to Konselor", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const version = await propose(db, setting);

      const answer = await askAnotherTime(
        db,
        setting.student,
        setting.id,
        version,
        ANOTHER,
        LATER,
      );

      expect(answer).toEqual({ kind: "kept", done: ASKED_ANOTHER });
      const board = await readScheduleBoard(
        db,
        setting.people.counsellor,
        { filter: "needs_action", page: 1 },
        LATER,
      );
      expect(board?.cards).toMatchObject([
        {
          status: "submitted",
          day: "2026-10-26",
          hour: "08:30",
          way: "online",
          reason: "Bentrok uji.",
          counsellorName: null,
        },
      ]);
      expect(board?.cards[0]?.steps.map((line) => line.step)).toEqual([
        "register",
        "propose",
        "ask_another",
      ]);
    });
  });

  it("Minta waktu lain is refused for a day before tomorrow", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const version = await propose(db, setting);

      const answer = await askAnotherTime(
        db,
        setting.student,
        setting.id,
        version,
        { ...ANOTHER, day: "2026-10-20" },
        LATER,
      );

      expect(answer).toEqual({ kind: "refused", error: PICK_FROM_TOMORROW });
      expect(await statusOf(db, setting.id)).toBe("proposed");
    });
  });

  it("is refused for a request that is not waiting for the student", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      const answer = await acceptSchedule(
        db,
        setting.student,
        setting.id,
        VERSION,
        NOW,
      );

      expect(answer).toEqual({
        kind: "changed",
        error: SCHEDULE_CHANGED_SINCE,
      });
      expect(await statusOf(db, setting.id)).toBe("submitted");
    });
  });
});

describe("a request of another student", () => {
  it("cannot be accepted or answered by another student, who gets nothing back", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const version = await propose(db, setting);

      const accepted = await acceptSchedule(
        db,
        setting.other,
        setting.id,
        version,
        LATER,
      );
      const asked = await askAnotherTime(
        db,
        setting.other,
        setting.id,
        version,
        ANOTHER,
        LATER,
      );

      const notFound = { kind: "refused", error: SCHEDULE_NOT_FOUND };
      expect(accepted).toEqual(notFound);
      expect(asked).toEqual(notFound);
      expect(await statusOf(db, setting.id)).toBe("proposed");
      expect(await readOwnSchedules(db, setting.other)).toEqual([]);
    });
  });
});

describe("a hand-made request of a role without the right", () => {
  it.each(["head_of_unit", "mentor", "discipline_officer", "student"] as const)(
    "is refused for %s to approve or propose, giving nothing back",
    async (role) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db);
        const other = { ...setting.people.counsellor, roles: [role] };

        expect(
          await approveSchedule(db, other, setting.id, VERSION, NOW),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(
          await proposeSchedule(db, other, setting.id, VERSION, PROPOSAL, NOW),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(await logOf(db)).toHaveLength(1);
      });
    },
  );

  it.each([
    "counsellor",
    "head_of_unit",
    "mentor",
    "discipline_officer",
  ] as const)(
    "is refused for %s to accept or ask for another time, giving nothing back",
    async (role) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db);
        const version = await propose(db, setting);
        const other = { ...setting.student, roles: [role] };

        expect(
          await acceptSchedule(db, other, setting.id, version, LATER),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(
          await askAnotherTime(db, other, setting.id, version, ANOTHER, LATER),
        ).toEqual(MOVE_NOT_ALLOWED);
        expect(await statusOf(db, setting.id)).toBe("proposed");
      });
    },
  );

  it("finds nothing for an id that is no request", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);

      expect(
        await approveSchedule(
          db,
          setting.people.counsellor,
          "bukan-id",
          VERSION,
          NOW,
        ),
      ).toEqual({ kind: "refused", error: SCHEDULE_NOT_FOUND });
    });
  });
});
