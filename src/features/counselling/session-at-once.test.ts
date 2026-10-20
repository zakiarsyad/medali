// Sample NIMs of this file: 9986212000 to 9986212099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { counsellingSessionChanges, counsellingSessions } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { SESSION_SAVED } from "./session-words";
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
