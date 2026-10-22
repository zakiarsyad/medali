// Sample NIMs of this file: 9986212000 to 9986212099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingSessionChanges, counsellingSessions } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  SESSION_CHANGED,
  SESSION_CHANGED_SINCE,
  SESSION_SAVED,
} from "@/mental-health/session-words";
import { changeSession } from "./change-session";
import { addTestActor } from "./test-consents";
import { addConsentedPeople, TEST_SESSION } from "./test-sessions";
import { writeSession } from "./write-session";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("session");

// 10:00 on campus on Selasa 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

describe("Simpan sesi pressed twice at the same moment", () => {
  it("keeps one session with one log line: the second waits, then is answered as the first", async () => {
    const people = await addConsentedPeople(
      own.db,
      "Prodi Uji Sesi Sekaligus 1",
      ["9986212001"],
    );
    const [studentId] = people.studentIds;
    const press = { id: randomUUID(), studentId };

    const both = await own.atOnce(
      (db) => writeSession(db, people.counsellor, press, TEST_SESSION, NOW),
      (db) => writeSession(db, people.counsellor, press, TEST_SESSION, NOW),
    );

    expect(both.sooner).toMatchObject({ kind: "kept", done: SESSION_SAVED });
    expect(both.later).toMatchObject({ kind: "kept", done: SESSION_SAVED });
    const kept = await own.db
      .select()
      .from(counsellingSessions)
      .where(eq(counsellingSessions.studentId, studentId ?? ""));
    expect(kept).toHaveLength(1);
    const lines = await own.db
      .select()
      .from(counsellingSessionChanges)
      .where(eq(counsellingSessionChanges.sessionId, press.id));
    expect(lines).toHaveLength(1);
  });
});

// 10:00 on campus on Rabu 21 October 2026.
const LATER = new Date("2026-10-21T03:00:00Z");

describe("two Konselor changing the same session at the same moment", () => {
  it("keep the first change; the second waits, then is told it was changed", async () => {
    const people = await addConsentedPeople(
      own.db,
      "Prodi Uji Sesi Sekaligus 2",
      ["9986212002"],
    );
    const [studentId] = people.studentIds;
    const id = randomUUID();
    await writeSession(
      own.db,
      people.counsellor,
      { id, studentId },
      TEST_SESSION,
      NOW,
    );
    const colleague = await addTestActor(own.db, "Konselor Uji Lain", [
      "counsellor",
    ]);
    const version = NOW.toISOString();

    const both = await own.atOnce(
      (db) =>
        changeSession(
          db,
          people.counsellor,
          id,
          version,
          { ...TEST_SESSION, notes: "Perubahan pertama." },
          LATER,
        ),
      (db) =>
        changeSession(
          db,
          colleague,
          id,
          version,
          { ...TEST_SESSION, notes: "Perubahan kedua." },
          LATER,
        ),
    );

    expect(both.sooner).toEqual({ kind: "kept", done: SESSION_CHANGED });
    expect(both.later).toEqual({
      kind: "changed",
      error: SESSION_CHANGED_SINCE,
    });
    const [kept] = await own.db
      .select()
      .from(counsellingSessions)
      .where(eq(counsellingSessions.id, id));
    expect(kept?.notes).toBe("Perubahan pertama.");
    const lines = await own.db
      .select()
      .from(counsellingSessionChanges)
      .where(eq(counsellingSessionChanges.sessionId, id));
    expect(lines).toHaveLength(2);
  });
});
