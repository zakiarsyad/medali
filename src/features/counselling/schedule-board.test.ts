// Sample NIMs of this file: 9986208000 to 9986208099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readScheduleBoard } from "./schedule-board";
import { addTestPeople, type TestPeople } from "./test-consents";
import { addTestSchedule, type TestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

// Selasa 20 October 2026, 10:00 on campus.
const NOW = new Date("2026-10-20T03:00:00Z");

const PROGRAM = "Prodi Uji Jadwal Konselor";

function nims(count: number): string[] {
  return Array.from({ length: count }, (_, place) =>
    String(9986208001 + place),
  );
}

/** Asks for a request of the student at `place`. */
function addFor(
  db: Database,
  people: TestPeople,
  place: number,
  more: Partial<TestSchedule> = {},
) {
  const student = people.students[place];
  if (!student?.studentId) throw new Error("Student missing.");
  return addTestSchedule(db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    ...more,
  });
}

describe("Jadwal konseling of Konselor", () => {
  it("counts Perlu dijadwalkan, Dijadwalkan 7 hari ke depan and Menunggu konfirmasi mahasiswa", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(5));
      const counsellorId = people.counsellor.id;
      await addFor(db, people, 0);
      await addFor(db, people, 1, { status: "proposed", counsellorId });
      await addFor(db, people, 2, {
        status: "scheduled",
        counsellorId,
        day: "2026-10-27",
      });
      await addFor(db, people, 3, {
        status: "scheduled",
        counsellorId,
        day: "2026-10-28",
      });
      await addFor(db, people, 4);

      const board = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );

      expect(board?.counts).toEqual({
        submitted: 2,
        scheduledSoon: 1,
        proposed: 1,
      });
    });
  });

  it("shows only Diajukan by default, and every request under Semua, Diajukan first then by day", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(3));
      const counsellorId = people.counsellor.id;
      await addFor(db, people, 0, {
        status: "scheduled",
        counsellorId,
        day: "2026-10-22",
      });
      await addFor(db, people, 1, { day: "2026-10-23" });
      await addFor(db, people, 2, { day: "2026-10-21" });

      const needed = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );
      const all = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "all", page: 1 },
        NOW,
      );
      const scheduled = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "scheduled", page: 1 },
        NOW,
      );

      expect(needed?.cards.map((card) => card.day)).toEqual([
        "2026-10-21",
        "2026-10-23",
      ]);
      expect(all?.cards.map((card) => card.status)).toEqual([
        "submitted",
        "submitted",
        "scheduled",
      ]);
      expect(scheduled?.cards.map((card) => card.status)).toEqual([
        "scheduled",
      ]);
    });
  });

  it.each(["done", "missed", "cancelled"] as const)(
    "shows only the requests that are %s under that choice, and none under Semua yang aktif",
    async (status) => {
      await inTestDatabase(async (db) => {
        const people = await addTestPeople(db, PROGRAM, nims(3));
        const counsellorId = people.counsellor.id;
        await addFor(db, people, 0, { status, counsellorId });
        await addFor(db, people, 1, { status: "scheduled", counsellorId });
        await addFor(db, people, 2);

        const chosen = await readScheduleBoard(
          db,
          people.counsellor,
          { filter: status, page: 1 },
          NOW,
        );
        const active = await readScheduleBoard(
          db,
          people.counsellor,
          { filter: "active", page: 1 },
          NOW,
        );

        expect(chosen?.cards.map((card) => card.status)).toEqual([status]);
        expect(active?.cards.map((card) => card.status)).toEqual([
          "submitted",
          "scheduled",
        ]);
      });
    },
  );

  it("lists under Semua the active ones first by day, Diajukan leading, then the finished, missed and cancelled ones, the latest first", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(6));
      const counsellorId = people.counsellor.id;
      await addFor(db, people, 0, {
        status: "done",
        counsellorId,
        day: "2026-10-05",
      });
      await addFor(db, people, 1, { day: "2026-10-23" });
      await addFor(db, people, 2, {
        status: "cancelled",
        counsellorId,
        day: "2026-10-14",
      });
      await addFor(db, people, 3, {
        status: "scheduled",
        counsellorId,
        day: "2026-10-22",
      });
      await addFor(db, people, 4, {
        status: "missed",
        counsellorId,
        day: "2026-10-09",
      });
      await addFor(db, people, 5, { day: "2026-10-21" });

      const all = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "all", page: 1 },
        NOW,
      );

      expect(all?.cards.map((card) => `${card.status} ${card.day}`)).toEqual([
        "submitted 2026-10-21",
        "submitted 2026-10-23",
        "scheduled 2026-10-22",
        "cancelled 2026-10-14",
        "missed 2026-10-09",
        "done 2026-10-05",
      ]);
    });
  });

  it("lists under Selesai the latest first", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(2));
      const counsellorId = people.counsellor.id;
      await addFor(db, people, 0, {
        status: "done",
        counsellorId,
        day: "2026-10-01",
      });
      await addFor(db, people, 1, {
        status: "done",
        counsellorId,
        day: "2026-10-08",
      });

      const done = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "done", page: 1 },
        NOW,
      );

      expect(done?.cards.map((card) => card.day)).toEqual([
        "2026-10-08",
        "2026-10-01",
      ]);
    });
  });

  it("gives a card the student, the story, the reason and every step with who took it", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(1));
      const id = await addFor(db, people, 0, {
        story: "Cerita uji.",
        reason: "Bentrok uji.",
      });

      const board = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );

      expect(board?.cards).toEqual([
        {
          id,
          name: "Mahasiswa Uji Konseling 1",
          nim: "9986208001",
          program: PROGRAM,
          status: "submitted",
          topic: "academic",
          day: "2026-10-21",
          hour: "10:00",
          way: "in_person",
          story: "Cerita uji.",
          reason: "Bentrok uji.",
          counsellorName: null,
          steps: [
            {
              id: expect.any(String),
              at: "19 Okt 2026, 10.00",
              by: "Mahasiswa Uji Konseling 1",
              step: "register",
            },
          ],
          version: "2026-10-19T03:00:00.000Z",
        },
      ]);
    });
  });

  it("loads 20 cards at a time", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, PROGRAM, nims(21));
      for (let place = 0; place < 21; place += 1) {
        await addFor(db, people, place);
      }

      const first = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 1 },
        NOW,
      );
      const second = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 2 },
        NOW,
      );
      const beyond = await readScheduleBoard(
        db,
        people.counsellor,
        { filter: "needs_action", page: 9 },
        NOW,
      );

      expect(first?.cards).toHaveLength(20);
      expect(first?.matching).toBe(21);
      expect(second?.cards).toHaveLength(1);
      expect(beyond?.page).toBe(2);
    });
  });

  it.each(["head_of_unit", "mentor", "discipline_officer", "student"] as const)(
    "gives %s nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await addTestPeople(db, PROGRAM, nims(1));
        await addFor(db, people, 0);
        const other = { ...people.counsellor, roles: [role] };

        expect(
          await readScheduleBoard(db, other, { filter: "all", page: 1 }, NOW),
        ).toBeNull();
      });
    },
  );
});
