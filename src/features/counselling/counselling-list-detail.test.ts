// Sample NIMs of this file: 9986331000 to 9986331099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { counsellingSessionReads, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { SESSION_NOT_ALLOWED } from "@/mental-health/session-words";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { openStudentSessions } from "./counselling-list-detail";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestSchedule } from "./test-schedules";
import { addConsentedPeople, TEST_SESSION } from "./test-sessions";
import { writeSession } from "./write-session";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on Rabu 21 October 2026.
const NOW = new Date("2026-10-21T03:00:00Z");

/** A student with consent and two sessions, of 12 and 19 October. */
async function withSessions(db: Database) {
  const people = await addConsentedPeople(db, "Prodi Uji Rincian Konseling", [
    "9986331001",
  ]);
  const [studentId] = people.studentIds;
  if (!studentId) throw new Error("The student was not added.");
  for (const day of ["2026-10-12", "2026-10-19"]) {
    const outcome = await writeSession(
      db,
      people.counsellor,
      { id: randomUUID(), studentId },
      { ...TEST_SESSION, day, notes: `Catatan ${day}.`, nextDay: "2026-10-28" },
      NOW,
    );
    if (outcome.kind !== "kept") throw new Error(outcome.error);
  }
  return { ...people, studentId };
}

function readsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(counsellingSessionReads)
    .where(eq(counsellingSessionReads.studentId, studentId));
}

describe("Rincian of Daftar mahasiswa", () => {
  it("shows the student's sessions, the latest first, with Jenis, Topik, konselor, Tindak lanjut, Sesi berikutnya and the notes", async () => {
    await inTestDatabase(async (db) => {
      const people = await withSessions(db);

      const opened = await openStudentSessions(
        db,
        people.counsellor,
        people.studentId,
        1,
        NOW,
      );

      expect(opened.ok).toBe(true);
      if (!opened.ok) return;
      expect(opened.value.hasMore).toBe(false);
      expect(opened.value.items).toEqual([
        expect.objectContaining({
          day: "2026-10-19",
          kind: "individual_in_person",
          topic: "academic",
          counsellorName: "Konselor Uji",
          followUp: "monitoring",
          nextDay: "2026-10-28",
          notes: "Catatan 2026-10-19.",
        }),
        expect.objectContaining({ day: "2026-10-12" }),
      ]);
    });
  });

  it("logs each opening as a reading of that student's notes, never the notes", async () => {
    await inTestDatabase(async (db) => {
      const people = await withSessions(db);

      await openStudentSessions(
        db,
        people.counsellor,
        people.studentId,
        1,
        NOW,
      );
      await openStudentSessions(
        db,
        people.counsellor,
        people.studentId,
        1,
        NOW,
      );

      const reads = await readsOf(db, people.studentId);
      expect(reads).toHaveLength(2);
      expect(reads[0]).toEqual({
        id: expect.any(String),
        studentId: people.studentId,
        readBy: people.counsellor.id,
        readAt: NOW,
      });
    });
  });

  it("shows no session for a student with only a schedule, without asking for consent", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Rincian Kosong", [
        "9986331002",
      ]);
      const [studentId] = people.studentIds;
      const [account] = people.students;
      if (!studentId || !account) throw new Error("No student.");
      await addTestSchedule(db, { studentId, studentAccountId: account.id });

      const opened = await openStudentSessions(
        db,
        people.counsellor,
        studentId,
        1,
        NOW,
      );

      expect(opened).toEqual({
        ok: true,
        value: { items: [], hasMore: false },
      });
    });
  });

  it("refuses a student not found or removed, and what is not an id, logging nothing", async () => {
    await inTestDatabase(async (db) => {
      const people = await withSessions(db);
      await db
        .update(students)
        .set({ deletedAt: NOW })
        .where(eq(students.id, people.studentId));

      for (const sent of [people.studentId, randomUUID(), "x", 7]) {
        expect(
          await openStudentSessions(db, people.counsellor, sent, 1, NOW),
        ).toEqual({ ok: false, error: STUDENT_NOT_FOUND });
      }
      expect(await readsOf(db, people.studentId)).toHaveLength(0);
    });
  });
});

const REFUSED: [string, RoleId][] = [
  ["Mahasiswa", "student"],
  ["Kepala Unit", "head_of_unit"],
  ["Direktur / Wakil Direktur", "director"],
  ["Ketua Program Studi", "head_of_program"],
  ["Pengasuh", "mentor"],
  ["Pembina Disiplin Mahasiswa", "discipline_officer"],
  ["Penilai Mahasiswa", "assessor"],
];

describe("a hand-made request for a Rincian", () => {
  it.each(REFUSED)(
    "is refused for %s, with nothing given back or logged",
    async (_, role) => {
      await inTestDatabase(async (db) => {
        const people = await withSessions(db);
        // The student asks for their own Rincian, with their own account.
        const [own] = people.students;
        const other =
          role === "student" && own
            ? own
            : await addTestActor(db, "Akun Uji Lain", [role]);

        expect(
          await openStudentSessions(db, other, people.studentId, 1, NOW),
        ).toEqual({ ok: false, error: SESSION_NOT_ALLOWED });
        expect(await readsOf(db, people.studentId)).toHaveLength(0);
      });
    },
  );
});
