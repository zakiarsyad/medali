import { and, eq, type SQL } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { counsellingSessionReads, students } from "@/db/schema";
import type { SessionHistory } from "@/mental-health/session-view";
import { SESSION_NOT_ALLOWED } from "@/mental-health/session-words";
import type { Parsed } from "@/parsed";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { counsellingListReachOf } from "./counselling-list";
import { readSessions, SESSIONS_PAGE_SIZE, stepsOf } from "./session-history";

/** Whether the student is one the account may list. */
async function isListedStudent(
  db: Database,
  reach: SQL,
  studentId: string,
): Promise<boolean> {
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), reach));
  return found !== undefined;
}

/**
 * "Rincian" of a student of "Daftar mahasiswa": their latest 10 sessions
 * for each step asked, the latest day first, with the notes. Each
 * opening is logged as a reading of that student's notes in the same
 * transaction, as "Riwayat sesi" logs one: who, whose notes and when,
 * never the notes. A student with no session shows none. Refused,
 * sending nothing and logging nothing, for an account without the right
 * and for a student it may not list. `studentId` and `steps` come from
 * outside.
 */
export async function openStudentSessions(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  steps: unknown,
  now: Date = new Date(),
): Promise<Parsed<SessionHistory>> {
  const reach = counsellingListReachOf(actor);
  if (reach === null) return { ok: false, error: SESSION_NOT_ALLOWED };
  if (typeof studentId !== "string" || !isUuid(studentId)) {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  if (!(await isListedStudent(db, reach, studentId))) {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  const limit = stepsOf(steps) * SESSIONS_PAGE_SIZE;
  return db.transaction(async (tx): Promise<Parsed<SessionHistory>> => {
    const read = await readSessions(tx, studentId, limit + 1);
    await tx
      .insert(counsellingSessionReads)
      .values({ studentId, readBy: actor.id, readAt: now });
    const value = { items: read.slice(0, limit), hasMore: read.length > limit };
    return { ok: true, value };
  });
}
