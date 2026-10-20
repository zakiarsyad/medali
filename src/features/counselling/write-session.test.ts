// Sample NIMs of this file: 9986211000 to 9986211099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSessionChanges, counsellingSessions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeConsentAsCounsellor, changeOwnConsent } from "./change-consent";
import { NO_CONSENT_VERSION } from "./consent-view";
import { STUDENT_NOT_FOUND } from "./consent-words";
import {
  DAY_IN_FUTURE,
  NEEDS_CONSENT,
  SESSION_ALREADY_SENT,
  SESSION_NOT_ALLOWED,
  SESSION_SAVED,
} from "./session-words";
import { addTestActor, addTestPeople } from "./test-consents";
import { addConsentedPeople, TEST_SESSION } from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

function sessionsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSessions)
    .where(eq(counsellingSessions.studentId, studentId));
}

function logOf(db: Database, sessionId: string) {
  return db
    .select()
    .from(counsellingSessionChanges)
    .where(eq(counsellingSessionChanges.sessionId, sessionId));
}

async function consented(db: Database, nim: string) {
  const people = await addConsentedPeople(db, "Prodi Uji Catat Sesi", [nim]);
  const [studentId] = people.studentIds;
  if (!studentId) throw new Error("Student missing.");
  return { ...people, studentId };
}

describe("Simpan sesi of Konselor", () => {
  it("keeps the session of a student with consent, as their work, with its log line", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await consented(db, "9986211001");
      const id = randomUUID();

      const outcome = await writeSession(
        db,
        counsellor,
        { id, studentId },
        { ...TEST_SESSION, nextDay: "2026-10-26" },
        NOW,
      );

      expect(outcome).toMatchObject({ kind: "kept", done: SESSION_SAVED });
      const [kept] = await sessionsOf(db, studentId);
      expect(kept).toMatchObject({
        id,
        day: "2026-10-19",
        kind: "individual_in_person",
        topic: "academic",
        notes: "Catatan uji sesi.",
        followUp: "monitoring",
        nextDay: "2026-10-26",
        scheduleId: null,
        writtenBy: counsellor.id,
        writtenAt: NOW,
        changedBy: counsellor.id,
        changedAt: NOW,
      });
      const lines = await logOf(db, id);
      expect(lines).toEqual([
        expect.objectContaining({
          changedBy: counsellor.id,
          changedAt: NOW,
          step: "write",
          before: null,
          after: {
            day: "2026-10-19",
            kind: "individual_in_person",
            topic: "academic",
            notes: "Catatan uji sesi.",
            followUp: "monitoring",
            nextDay: "2026-10-26",
          },
        }),
      ]);
    });
  });

  it("keeps one session when the same form is sent twice, and answers the second as the first", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await consented(db, "9986211002");
      const press = { id: randomUUID(), studentId };

      await writeSession(db, counsellor, press, TEST_SESSION, NOW);
      const again = await writeSession(
        db,
        counsellor,
        press,
        TEST_SESSION,
        NOW,
      );

      expect(again).toMatchObject({ kind: "kept", done: SESSION_SAVED });
      expect(await sessionsOf(db, studentId)).toHaveLength(1);
      expect(await logOf(db, press.id)).toHaveLength(1);
    });
  });

  it("refuses a form sent again after it was changed, keeping the first", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await consented(db, "9986211003");
      const press = { id: randomUUID(), studentId };
      await writeSession(db, counsellor, press, TEST_SESSION, NOW);

      const again = await writeSession(
        db,
        counsellor,
        press,
        { ...TEST_SESSION, notes: "Catatan lain." },
        NOW,
      );

      expect(again).toEqual({ kind: "refused", error: SESSION_ALREADY_SENT });
      const [kept] = await sessionsOf(db, studentId);
      expect(kept?.notes).toBe("Catatan uji sesi.");
    });
  });

  it("keeps nothing for what the rules refuse, saying why", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await consented(db, "9986211004");

      const outcome = await writeSession(
        db,
        counsellor,
        { id: randomUUID(), studentId },
        { ...TEST_SESSION, day: "2026-10-21" },
        NOW,
      );

      expect(outcome).toEqual({ kind: "refused", error: DAY_IN_FUTURE });
      expect(await sessionsOf(db, studentId)).toHaveLength(0);
    });
  });

  it("is refused for a student never asked, or asked and not answered, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Catat Sesi", [
        "9986211005",
        "9986211006",
      ]);
      const [never, waiting] = people.studentIds;
      await changeConsentAsCounsellor(
        db,
        people.counsellor,
        waiting,
        "ask",
        NO_CONSENT_VERSION,
        NOW,
      );

      for (const studentId of [never, waiting]) {
        const outcome = await writeSession(
          db,
          people.counsellor,
          { id: randomUUID(), studentId },
          TEST_SESSION,
          NOW,
        );
        expect(outcome).toEqual({ kind: "refused", error: NEEDS_CONSENT });
        expect(await sessionsOf(db, studentId ?? "")).toHaveLength(0);
      }
    });
  });

  it("is refused once the student withdrew their consent", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, students, studentId } = await consented(
        db,
        "9986211007",
      );
      const [student] = students;
      if (!student) throw new Error("Student missing.");
      const consent = await changeOwnConsent(
        db,
        student,
        "withdraw",
        "2026-10-19T03:00:00.000Z",
        NOW,
      );
      expect(consent.kind).toBe("kept");

      const outcome = await writeSession(
        db,
        counsellor,
        { id: randomUUID(), studentId },
        TEST_SESSION,
        NOW,
      );

      expect(outcome).toEqual({ kind: "refused", error: NEEDS_CONSENT });
      expect(await sessionsOf(db, studentId)).toHaveLength(0);
    });
  });

  it("is refused for a student that is not found", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await consented(db, "9986211008");

      for (const studentId of [randomUUID(), "bukan-id", 7]) {
        const outcome = await writeSession(
          db,
          counsellor,
          { id: randomUUID(), studentId },
          TEST_SESSION,
          NOW,
        );
        expect(outcome).toEqual({ kind: "refused", error: STUDENT_NOT_FOUND });
      }
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "counsellor"))(
    "is refused for %s, keeping nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { studentId, students } = await consented(db, "9986211009");
        const [student] = students;
        const actor =
          role === "student" && student
            ? student
            : await addTestActor(db, "Akun Uji Bukan Konselor", [role]);

        const outcome = await writeSession(
          db,
          actor,
          { id: randomUUID(), studentId },
          TEST_SESSION,
          NOW,
        );

        expect(outcome).toEqual({
          kind: "refused",
          error: SESSION_NOT_ALLOWED,
        });
        expect(await sessionsOf(db, studentId)).toHaveLength(0);
      });
    },
  );
});
