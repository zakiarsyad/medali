// Sample NIMs of this file: 9986210000 to 9986210099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnHistory } from "./own-history";
import type { ScheduleStatus } from "./schedule-ids";
import { addTestPeople, type TestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";

const inTestDatabase = withTestDatabase();

/** Two students of the file's own program. */
function addPeople(db: Database): Promise<TestPeople> {
  return addTestPeople(db, "Prodi Uji Riwayat Konseling", [
    "9986210001",
    "9986210002",
  ]);
}

/** A request of the student at `place`, on `day`, in `status`. */
function addFor(
  db: Database,
  people: TestPeople,
  place: number,
  status: ScheduleStatus,
  day: string,
) {
  const student = people.students[place];
  if (!student?.studentId) throw new Error("Student missing.");
  return addTestSchedule(db, {
    studentId: student.studentId,
    studentAccountId: student.id,
    status,
    day,
    counsellorId: people.counsellor.id,
  });
}

describe("Riwayat of the student", () => {
  it("lists their finished, missed and cancelled requests, the latest first, with date, status and Topik", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      await addFor(db, people, 0, "done", "2026-10-05");
      await addFor(db, people, 0, "cancelled", "2026-10-14");
      await addFor(db, people, 0, "missed", "2026-10-09");
      await addFor(db, people, 0, "scheduled", "2026-10-22");
      await addFor(db, people, 1, "done", "2026-10-12");
      const [student] = people.students;
      if (!student) throw new Error("Student missing.");

      const history = await readOwnHistory(db, student, 10);

      expect(history).toMatchObject({
        hasMore: false,
        items: [
          { status: "cancelled", day: "2026-10-14", topic: "academic" },
          { status: "missed", day: "2026-10-09" },
          { status: "done", day: "2026-10-05" },
        ],
      });
    });
  });

  it("shows as many as asked, and says when there are more", async () => {
    await inTestDatabase(async (db) => {
      const people = await addPeople(db);
      for (let day = 1; day <= 12; day += 1) {
        const shown = String(day).padStart(2, "0");
        await addFor(db, people, 0, "done", `2026-09-${shown}`);
      }
      const [student] = people.students;
      if (!student) throw new Error("Student missing.");

      const first = await readOwnHistory(db, student, 10);
      const all = await readOwnHistory(db, student, 20);

      expect(first.items).toHaveLength(10);
      expect(first.hasMore).toBe(true);
      expect(first.items[0]?.day).toBe("2026-09-12");
      expect(all.items).toHaveLength(12);
      expect(all.hasMore).toBe(false);
    });
  });

  it.each(["counsellor", "head_of_unit", "mentor"] as const)(
    "gives nothing to %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await addPeople(db);
        await addFor(db, people, 0, "done", "2026-10-05");
        const [student] = people.students;
        if (!student) throw new Error("Student missing.");

        const history = await readOwnHistory(
          db,
          { ...student, roles: [role] },
          10,
        );

        expect(history).toEqual({ items: [], hasMore: false });
      });
    },
  );
});
