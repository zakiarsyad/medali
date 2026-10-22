// Sample NIMs of this file: 9986323000 to 9986323099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingScheduleChanges, counsellingSchedules } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { ScheduleStatus } from "@/mental-health/schedule-ids";
import { approveSchedule, MOVE_NOT_ALLOWED } from "./move-schedule";
import {
  APPROVED,
  NOT_FOR_THIS_KIND,
  PICK_WEEKDAY,
  SCHEDULE_NOT_FOUND,
  TIME_PASSED,
  TIME_SET,
} from "./schedule-words";
import { setScheduleTime } from "./set-schedule-time";
import { addTestActor, addTestPeople, type TestPeople } from "./test-consents";
import { addTestAssignment, addTestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Senin 19 and Selasa 20 October 2026.
const SENT_AT = new Date("2026-10-19T03:00:00Z");
const NOW = new Date("2026-10-20T03:00:00Z");

const VERSION = SENT_AT.toISOString();

const TIME = {
  day: "2026-10-23",
  hour: "13:00",
  way: "online",
  message: "Tautan dikirim lewat surel kampus.",
};

interface Setting {
  people: TestPeople;
  sender: AccountForAccess;
  id: string;
}

/** A student with a Penugasan in `status`, sent by a Pembina Disiplin Mahasiswa. */
async function setUp(
  db: Database,
  status: ScheduleStatus = "awaiting",
): Promise<Setting> {
  const people = await addTestPeople(db, "Prodi Uji Tetapkan Jadwal", [
    "9986323001",
  ]);
  const [studentId] = people.studentIds;
  if (!studentId) throw new Error("Student missing.");
  const sender = await addTestActor(db, "Pembina Uji", ["discipline_officer"]);
  const id = await addTestAssignment(db, {
    studentId,
    senderId: sender.id,
    status,
    day: "2026-10-26",
    reason: status === "reschedule_asked" ? "Bentrok uji." : null,
    counsellorId: status === "awaiting" ? null : people.counsellor.id,
    at: SENT_AT,
  });
  return { people, sender, id };
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

async function rowOf(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(counsellingSchedules)
    .where(eq(counsellingSchedules.id, id));
  return kept;
}

describe("Tetapkan jadwal of Konselor on an assignment", () => {
  it.each(["awaiting", "reschedule_asked"] as const)(
    "makes one %s Dijadwalkan at once at the time sent, with the message, logged",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { people, id } = await setUp(db, status);

        const answer = await setScheduleTime(
          db,
          people.counsellor,
          id,
          VERSION,
          TIME,
          NOW,
        );

        expect(answer).toMatchObject({
          kind: "kept",
          done: TIME_SET,
          card: {
            status: "scheduled",
            day: "2026-10-23",
            hour: "13:00",
            way: "online",
            counsellorName: "Konselor Uji",
          },
        });
        expect(await rowOf(db, id)).toMatchObject({
          status: "scheduled",
          counsellorId: people.counsellor.id,
          counsellorMessage: TIME.message,
        });
        expect((await logOf(db, id)).at(-1)).toEqual({
          changedBy: people.counsellor.id,
          changedAt: NOW,
          step: "set_time",
          statusBefore: status,
          statusAfter: "scheduled",
        });
      });
    },
  );

  it.each([
    ["Sabtu", "2026-10-24", "10:00", PICK_WEEKDAY],
    ["a time already passed", "2026-10-20", "08:30", TIME_PASSED],
  ])("is refused for %s, changing nothing", async (_, day, hour, error) => {
    await inTestDatabase(async (db) => {
      const { people, id } = await setUp(db);

      const answer = await setScheduleTime(
        db,
        people.counsellor,
        id,
        VERSION,
        { ...TIME, day, hour },
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error });
      expect((await rowOf(db, id))?.status).toBe("awaiting");
      expect(await logOf(db, id)).toHaveLength(1);
    });
  });

  it("is refused on a voluntary request, changing nothing", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await setUp(db);
      const [student] = people.students;
      if (!student?.studentId) throw new Error("Student missing.");
      const id = await addTestSchedule(db, {
        studentId: student.studentId,
        studentAccountId: student.id,
        at: SENT_AT,
      });

      const answer = await setScheduleTime(
        db,
        people.counsellor,
        id,
        VERSION,
        TIME,
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error: NOT_FOR_THIS_KIND });
      expect((await rowOf(db, id))?.status).toBe("submitted");
    });
  });

  it.each([
    "head_of_unit",
    "director",
    "head_of_program",
    "dorm_manager",
    "discipline_officer",
    "assessor",
    "student",
  ] as const)(
    "is refused for %s, also the sender, changing nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { sender, id } = await setUp(db);
        const other = { ...sender, roles: [role] };

        const answer = await setScheduleTime(db, other, id, VERSION, TIME, NOW);

        expect(answer).toEqual(MOVE_NOT_ALLOWED);
        expect(await logOf(db, id)).toHaveLength(1);
      });
    },
  );

  it("is not found for an id that is no schedule", async () => {
    await inTestDatabase(async (db) => {
      const { people } = await setUp(db);

      const answer = await setScheduleTime(
        db,
        people.counsellor,
        "bukan-id",
        VERSION,
        TIME,
        NOW,
      );

      expect(answer).toEqual({ kind: "refused", error: SCHEDULE_NOT_FOUND });
    });
  });
});

describe("Setujui waktu ini on an assignment", () => {
  it("makes Minta jadwal ulang Dijadwalkan at the time the student asked, logged", async () => {
    await inTestDatabase(async (db) => {
      const { people, id } = await setUp(db, "reschedule_asked");

      const answer = await approveSchedule(
        db,
        people.counsellor,
        id,
        VERSION,
        NOW,
      );

      expect(answer).toMatchObject({
        kind: "kept",
        done: APPROVED,
        card: { status: "scheduled", day: "2026-10-26", hour: "10:00" },
      });
      expect((await logOf(db, id)).at(-1)).toMatchObject({
        step: "approve",
        statusBefore: "reschedule_asked",
        statusAfter: "scheduled",
      });
    });
  });

  it("is refused while it is Menunggu jadwal, with the card as it is", async () => {
    await inTestDatabase(async (db) => {
      const { people, id } = await setUp(db);

      const answer = await approveSchedule(
        db,
        people.counsellor,
        id,
        VERSION,
        NOW,
      );

      expect(answer).toMatchObject({
        kind: "changed",
        card: { status: "awaiting" },
      });
      expect(await logOf(db, id)).toHaveLength(1);
    });
  });
});
