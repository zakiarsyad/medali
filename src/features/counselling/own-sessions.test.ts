// Sample NIMs of this file: 9986216000 to 9986216099.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnSessionSummary } from "./own-sessions";
import { addTestActor } from "./test-consents";
import { addConsentedPeople, TEST_SESSION } from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

async function people(db: Database) {
  return addConsentedPeople(db, "Prodi Uji Sesi Sendiri", [
    "9986216001",
    "9986216002",
  ]);
}

async function addSession(
  db: Database,
  found: Awaited<ReturnType<typeof people>>,
  studentId: string | undefined,
  day: string,
  nextDay = "",
): Promise<void> {
  const outcome = await writeSession(
    db,
    found.counsellor,
    { id: randomUUID(), studentId },
    { ...TEST_SESSION, day, nextDay },
    NOW,
  );
  if (outcome.kind !== "kept") throw new Error(outcome.error);
}

describe("the student's own counselling sessions", () => {
  it("are counted with the day of the latest and its next session, never with the notes", async () => {
    await inTestDatabase(async (db) => {
      const found = await people(db);
      const [own, other] = found.studentIds;
      await addSession(db, found, own, "2026-10-05", "2026-10-12");
      await addSession(db, found, own, "2026-10-19", "2026-10-26");
      await addSession(db, found, own, "2026-10-12");
      await addSession(db, found, other, "2026-10-20");
      const [student] = found.students;
      if (!student) throw new Error("Student missing.");

      expect(await readOwnSessionSummary(db, student, NOW)).toEqual({
        count: 3,
        lastDay: "2026-10-19",
        nextDay: "2026-10-26",
      });
    });
  });

  it("have no next session when the latest sets none", async () => {
    await inTestDatabase(async (db) => {
      const found = await people(db);
      const [own] = found.studentIds;
      await addSession(db, found, own, "2026-10-05", "2026-10-26");
      await addSession(db, found, own, "2026-10-19");
      const [student] = found.students;
      if (!student) throw new Error("Student missing.");

      expect(await readOwnSessionSummary(db, student, NOW)).toEqual({
        count: 2,
        lastDay: "2026-10-19",
        nextDay: null,
      });
    });
  });

  it("leave out a next session that has passed, and keep one of today", async () => {
    await inTestDatabase(async (db) => {
      const found = await people(db);
      const [own, other] = found.studentIds;
      await addSession(db, found, own, "2026-10-12", "2026-10-19");
      await addSession(db, found, other, "2026-10-12", "2026-10-20");
      const [student, otherStudent] = found.students;
      if (!student || !otherStudent) throw new Error("Student missing.");

      expect(await readOwnSessionSummary(db, student, NOW)).toEqual({
        count: 1,
        lastDay: "2026-10-12",
        nextDay: null,
      });
      expect(await readOwnSessionSummary(db, otherStudent, NOW)).toEqual({
        count: 1,
        lastDay: "2026-10-12",
        nextDay: "2026-10-20",
      });
    });
  });

  it("are nothing for a student with no session", async () => {
    await inTestDatabase(async (db) => {
      const found = await people(db);
      const [student] = found.students;
      if (!student) throw new Error("Student missing.");

      expect(await readOwnSessionSummary(db, student, NOW)).toBeNull();
    });
  });

  it("are nothing for an account without the right, Konselor and Kepala Unit among them", async () => {
    await inTestDatabase(async (db) => {
      const found = await people(db);
      const [own] = found.studentIds;
      await addSession(db, found, own, "2026-10-19");
      const studentId = own ?? null;
      const head = await addTestActor(db, "Kepala Unit Uji", ["head_of_unit"]);
      const counsellor = { ...found.counsellor, studentId };

      for (const actor of [{ ...head, studentId }, counsellor]) {
        expect(await readOwnSessionSummary(db, actor, NOW)).toBeNull();
      }
    });
  });
});
