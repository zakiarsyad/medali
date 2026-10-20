import { and, eq } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import type { SessionContent } from "@/features/counselling/session-ids";
import type { Database } from "./connect";
import {
  SAMPLE_SESSIONS,
  type SampleSession,
} from "./sample-counselling-sessions";
import {
  counsellingSchedules,
  counsellingSessionChanges,
  counsellingSessions,
} from "./schema";
import { counsellorId, studentOf } from "./seed-counselling-consents";
import { momentOf } from "./seed-siku-adjustments";

interface Held {
  scheduleId: string | null;
  day: string;
}

/** The student's one Selesai session, which the sample was written for. */
async function doneScheduleOf(db: Database, studentId: string): Promise<Held> {
  const [found] = await db
    .select({ id: counsellingSchedules.id, day: counsellingSchedules.day })
    .from(counsellingSchedules)
    .where(
      and(
        eq(counsellingSchedules.studentId, studentId),
        eq(counsellingSchedules.status, "done"),
      ),
    );
  if (!found) throw new Error("A sample session names no Selesai session.");
  return { scheduleId: found.id, day: found.day };
}

function heldOn(
  db: Database,
  sample: SampleSession,
  studentId: string,
  today: string,
): Promise<Held> | Held {
  if (sample.forDoneSchedule) return doneScheduleOf(db, studentId);
  return { scheduleId: null, day: daysAfter(today, -sample.daysAgo) };
}

/**
 * Adds the sample counselling sessions, each with the log line of its
 * writing, and of its change for one changed the day after, as the work
 * of the sample Konselor. The sample students, consents and requests for
 * counselling must be there already. `today` is today on campus.
 */
export async function addSampleCounsellingSessions(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const counsellor = await counsellorId(db);
  for (const sample of SAMPLE_SESSIONS) {
    const student = await studentOf(db, sample.nim);
    const held = await heldOn(db, sample, student.id, today);
    const writtenAt = momentOf(daysAfter(today, -sample.daysAgo), now);
    const changedAt = sample.firstNotes
      ? momentOf(daysAfter(today, 1 - sample.daysAgo), now)
      : writtenAt;
    const content: SessionContent = {
      day: held.day,
      kind: sample.kind,
      topic: sample.topic,
      notes: sample.notes,
      followUp: sample.followUp,
      nextDay:
        sample.nextInDays === null ? null : daysAfter(today, sample.nextInDays),
    };
    const [session] = await db
      .insert(counsellingSessions)
      .values({
        studentId: student.id,
        scheduleId: held.scheduleId,
        ...content,
        writtenBy: counsellor,
        writtenAt,
        changedBy: counsellor,
        changedAt,
      })
      .returning({ id: counsellingSessions.id });
    if (!session) throw new Error("A sample session was not added.");
    const first = sample.firstNotes
      ? { ...content, notes: sample.firstNotes }
      : content;
    const lines: (typeof counsellingSessionChanges.$inferInsert)[] = [
      {
        sessionId: session.id,
        changedBy: counsellor,
        changedAt: writtenAt,
        step: "write",
        before: null,
        after: first,
      },
    ];
    if (sample.firstNotes) {
      lines.push({
        sessionId: session.id,
        changedBy: counsellor,
        changedAt,
        step: "change",
        before: first,
        after: content,
      });
    }
    await db.insert(counsellingSessionChanges).values(lines);
  }
}
