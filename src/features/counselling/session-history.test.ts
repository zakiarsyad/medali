// Sample NIMs of this file: 9986214000 to 9986214099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSessionReads } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeConsentAsCounsellor, changeOwnConsent } from "./change-consent";
import { NO_CONSENT_VERSION } from "./consent-view";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { readSessionHistory } from "./session-history";
import { NEEDS_CONSENT, SESSION_NOT_ALLOWED } from "./session-words";
import { addTestActor, addTestPeople } from "./test-consents";
import {
  addConsentedPeople,
  CONSENTED_AT,
  TEST_SESSION,
} from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

async function consented(db: Database, nim: string) {
  const people = await addConsentedPeople(db, `Prodi Uji Riwayat ${nim}`, [
    nim,
  ]);
  const [studentId] = people.studentIds;
  const [student] = people.students;
  if (!studentId || !student) throw new Error("Student missing.");
  return { ...people, studentId, student };
}

/** Sessions on the days given, each written at 10:00 on that day. */
async function addSessions(
  db: Database,
  people: Awaited<ReturnType<typeof consented>>,
  days: string[],
): Promise<void> {
  for (const day of days) {
    const outcome = await writeSession(
      db,
      people.counsellor,
      { id: randomUUID(), studentId: people.studentId },
      { ...TEST_SESSION, day, notes: `Catatan ${day}.` },
      NOW,
    );
    if (outcome.kind !== "kept") throw new Error(outcome.error);
  }
}

function readsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSessionReads)
    .where(eq(counsellingSessionReads.studentId, studentId));
}

describe("Riwayat sesi of Konselor", () => {
  it("lists the student's sessions, the latest day first, each with its writer", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214001");
      await addSessions(db, people, ["2026-10-12", "2026-10-19", "2026-10-15"]);

      const read = await readSessionHistory(
        db,
        people.counsellor,
        people.studentId,
        1,
        NOW,
      );

      expect(read.ok).toBe(true);
      if (!read.ok) return;
      expect(read.value.hasMore).toBe(false);
      expect(read.value.items.map((item) => item.day)).toEqual([
        "2026-10-19",
        "2026-10-15",
        "2026-10-12",
      ]);
      expect(read.value.items[0]).toMatchObject({
        kind: "individual_in_person",
        topic: "academic",
        notes: "Catatan 2026-10-19.",
        followUp: "monitoring",
        nextDay: null,
        counsellorName: "Konselor Uji",
        changed: null,
        version: NOW.toISOString(),
      });
    });
  });

  it("is empty for a student with no session", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214002");

      const read = await readSessionHistory(
        db,
        people.counsellor,
        people.studentId,
        1,
        NOW,
      );

      expect(read).toEqual({
        ok: true,
        value: { items: [], hasMore: false },
      });
    });
  });

  it("shows the latest 10, and 10 more for each step asked", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214003");
      const days = Array.from(
        { length: 12 },
        (_, place) => `2026-10-${String(place + 1).padStart(2, "0")}`,
      );
      await addSessions(db, people, days);
      const { counsellor, studentId } = people;

      const first = await readSessionHistory(db, counsellor, studentId, 1, NOW);
      const second = await readSessionHistory(
        db,
        counsellor,
        studentId,
        2,
        NOW,
      );

      expect(first.ok && first.value.items.length).toBe(10);
      expect(first.ok && first.value.hasMore).toBe(true);
      expect(first.ok && first.value.items[0]?.day).toBe("2026-10-12");
      expect(second.ok && second.value.items.length).toBe(12);
      expect(second.ok && second.value.hasMore).toBe(false);
    });
  });

  it.each([0, -1, 1.5, "2", null])(
    "reads the first 10 for a step that is not one: %s",
    async (steps) => {
      await inTestDatabase(async (db) => {
        const people = await consented(db, "9986214004");
        const days = Array.from(
          { length: 11 },
          (_, place) => `2026-10-${String(place + 1).padStart(2, "0")}`,
        );
        await addSessions(db, people, days);

        const read = await readSessionHistory(
          db,
          people.counsellor,
          people.studentId,
          steps,
          NOW,
        );

        expect(read.ok && read.value.items.length).toBe(10);
      });
    },
  );

  it("logs each reading: who, whose notes and when, never the notes", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214005");
      await addSessions(db, people, ["2026-10-19"]);
      const colleague = await addTestActor(db, "Konselor Uji Lain", [
        "counsellor",
      ]);

      await readSessionHistory(db, people.counsellor, people.studentId, 1, NOW);
      await readSessionHistory(db, colleague, people.studentId, 1, NOW);

      const reads = await readsOf(db, people.studentId);
      expect(reads.map((line) => line.readBy).sort()).toEqual(
        [people.counsellor.id, colleague.id].sort(),
      );
      for (const line of reads) {
        expect(line.readAt).toEqual(NOW);
        expect(Object.keys(line).sort()).toEqual(
          ["id", "readAt", "readBy", "studentId"].sort(),
        );
      }
    });
  });

  it("is still read by every Konselor once the consent is withdrawn", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214006");
      await addSessions(db, people, ["2026-10-19"]);
      await changeOwnConsent(
        db,
        people.student,
        "withdraw",
        CONSENTED_AT.toISOString(),
        NOW,
      );
      const colleague = await addTestActor(db, "Konselor Uji Lain", [
        "counsellor",
      ]);

      const read = await readSessionHistory(
        db,
        colleague,
        people.studentId,
        1,
        NOW,
      );

      expect(read.ok && read.value.items.length).toBe(1);
    });
  });

  it("is refused, logging no reading, for a student who never gave consent", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Riwayat Tanpa", [
        "9986214020",
        "9986214021",
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
        expect(
          await readSessionHistory(db, people.counsellor, studentId, 1, NOW),
        ).toEqual({ ok: false, error: NEEDS_CONSENT });
        expect(await readsOf(db, studentId ?? "")).toHaveLength(0);
      }
    });
  });

  it("is refused once the consent is withdrawn when no session was written", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214022");
      await changeOwnConsent(
        db,
        people.student,
        "withdraw",
        CONSENTED_AT.toISOString(),
        NOW,
      );

      expect(
        await readSessionHistory(
          db,
          people.counsellor,
          people.studentId,
          1,
          NOW,
        ),
      ).toEqual({ ok: false, error: NEEDS_CONSENT });
      expect(await readsOf(db, people.studentId)).toHaveLength(0);
    });
  });

  it("is refused for a student not found", async () => {
    await inTestDatabase(async (db) => {
      const people = await consented(db, "9986214007");

      for (const studentId of [randomUUID(), "bukan-id", 7]) {
        expect(
          await readSessionHistory(db, people.counsellor, studentId, 1, NOW),
        ).toEqual({ ok: false, error: STUDENT_NOT_FOUND });
      }
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "counsellor"))(
    "is refused for %s, sending no notes and logging no reading",
    async (role) => {
      await inTestDatabase(async (db) => {
        const people = await consented(db, "9986214008");
        await addSessions(db, people, ["2026-10-19"]);
        const actor =
          role === "student"
            ? people.student
            : await addTestActor(db, "Akun Uji Bukan Konselor", [role]);

        const read = await readSessionHistory(
          db,
          actor,
          people.studentId,
          1,
          NOW,
        );

        expect(read).toEqual({ ok: false, error: SESSION_NOT_ALLOWED });
        expect(await readsOf(db, people.studentId)).toHaveLength(0);
      });
    },
  );
});
