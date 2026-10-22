// Sample NIMs of this file: 9986215000 to 9986215099.
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSessionChanges, counsellingSessions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  DAY_IN_FUTURE,
  NEEDS_CONSENT,
  SESSION_CHANGED,
  SESSION_CHANGED_SINCE,
  SESSION_NOT_ALLOWED,
  SESSION_NOT_FOUND,
} from "@/mental-health/session-words";
import { changeOwnConsent } from "./change-consent";
import { changeSession } from "./change-session";
import { readSessionHistory } from "./session-history";
import { addTestActor } from "./test-consents";
import {
  addConsentedPeople,
  CONSENTED_AT,
  TEST_SESSION,
} from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Selasa 20 and Rabu 21 October 2026.
const WRITTEN_AT = new Date("2026-10-20T03:00:00Z");
const NOW = new Date("2026-10-21T03:00:00Z");

const VERSION = WRITTEN_AT.toISOString();

const CHANGED = {
  ...TEST_SESSION,
  kind: "group",
  topic: "family",
  notes: "Catatan yang diubah.",
  followUp: "next_session",
  nextDay: "2026-10-28",
};

async function written(db: Database, nim: string) {
  const people = await addConsentedPeople(db, `Prodi Uji Ubah Sesi ${nim}`, [
    nim,
  ]);
  const [studentId] = people.studentIds;
  const [student] = people.students;
  if (!studentId || !student) throw new Error("Student missing.");
  const id = randomUUID();
  const outcome = await writeSession(
    db,
    people.counsellor,
    { id, studentId },
    TEST_SESSION,
    WRITTEN_AT,
  );
  if (outcome.kind !== "kept") throw new Error(outcome.error);
  return { ...people, studentId, student, id };
}

function sessionOf(db: Database, id: string) {
  return db
    .select()
    .from(counsellingSessions)
    .where(eq(counsellingSessions.id, id));
}

function logOf(db: Database, id: string) {
  return db
    .select()
    .from(counsellingSessionChanges)
    .where(eq(counsellingSessionChanges.sessionId, id))
    .orderBy(asc(counsellingSessionChanges.changedAt));
}

describe("Ubah on a session", () => {
  it("keeps the new content as the work of the Konselor who changed it, with a log line of before and after", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, id } = await written(db, "9986215001");
      const colleague = await addTestActor(db, "Konselor Uji Lain", [
        "counsellor",
      ]);

      const outcome = await changeSession(
        db,
        colleague,
        id,
        VERSION,
        CHANGED,
        NOW,
      );

      expect(outcome).toEqual({ kind: "kept", done: SESSION_CHANGED });
      const [kept] = await sessionOf(db, id);
      expect(kept).toMatchObject({
        kind: "group",
        topic: "family",
        notes: "Catatan yang diubah.",
        followUp: "next_session",
        nextDay: "2026-10-28",
        changedBy: colleague.id,
        changedAt: NOW,
        writtenAt: WRITTEN_AT,
      });
      const lines = await logOf(db, id);
      expect(lines.map((line) => line.step)).toEqual(["write", "change"]);
      expect(lines[1]).toMatchObject({
        changedBy: colleague.id,
        changedAt: NOW,
        before: { notes: "Catatan uji sesi.", kind: "individual_in_person" },
        after: { notes: "Catatan yang diubah.", kind: "group" },
      });

      const read = await readSessionHistory(db, colleague, studentId, 1, NOW);
      expect(read.ok && read.value.items[0]).toMatchObject({
        notes: "Catatan yang diubah.",
        counsellorName: "Konselor Uji",
        changed: { at: NOW, by: "Konselor Uji Lain" },
      });
    });
  });

  it("is refused, changing nothing, when the session changed since the form opened", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, id } = await written(db, "9986215002");
      await changeSession(db, counsellor, id, VERSION, CHANGED, NOW);

      const outcome = await changeSession(
        db,
        counsellor,
        id,
        VERSION,
        { ...CHANGED, notes: "Perubahan lama." },
        NOW,
      );

      expect(outcome).toEqual({
        kind: "changed",
        error: SESSION_CHANGED_SINCE,
      });
      const [kept] = await sessionOf(db, id);
      expect(kept?.notes).toBe("Catatan yang diubah.");
      expect(await logOf(db, id)).toHaveLength(2);
    });
  });

  it("keeps nothing for what the rules refuse, saying why", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, id } = await written(db, "9986215003");

      const outcome = await changeSession(
        db,
        counsellor,
        id,
        VERSION,
        { ...CHANGED, day: "2026-10-22" },
        NOW,
      );

      expect(outcome).toEqual({ kind: "refused", error: DAY_IN_FUTURE });
      expect(await logOf(db, id)).toHaveLength(1);
    });
  });

  it("is refused once the consent is withdrawn, and the session is kept as it was", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, student, id } = await written(db, "9986215004");
      await changeOwnConsent(
        db,
        student,
        "withdraw",
        CONSENTED_AT.toISOString(),
        NOW,
      );

      const outcome = await changeSession(
        db,
        counsellor,
        id,
        VERSION,
        CHANGED,
        NOW,
      );

      expect(outcome).toEqual({ kind: "refused", error: NEEDS_CONSENT });
      const [kept] = await sessionOf(db, id);
      expect(kept?.notes).toBe("Catatan uji sesi.");
    });
  });

  it("is refused for a session not found", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor } = await written(db, "9986215005");

      for (const id of [randomUUID(), "bukan-id", 7]) {
        expect(
          await changeSession(db, counsellor, id, VERSION, CHANGED, NOW),
        ).toEqual({ kind: "refused", error: SESSION_NOT_FOUND });
      }
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "counsellor"))(
    "is refused for %s, changing nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { student, id } = await written(db, "9986215006");
        const actor =
          role === "student"
            ? student
            : await addTestActor(db, "Akun Uji Bukan Konselor", [role]);

        const outcome = await changeSession(
          db,
          actor,
          id,
          VERSION,
          CHANGED,
          NOW,
        );

        expect(outcome).toEqual({
          kind: "refused",
          error: SESSION_NOT_ALLOWED,
        });
        expect(await logOf(db, id)).toHaveLength(1);
      });
    },
  );
});
