import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormActivities,
  dormAttendanceChanges,
  dormAttendanceCounts,
  dormAttendanceMarks,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { CountMarks } from "./count-ids";
import type { CountInput } from "./count-input";
import { loggedMarks } from "./count-marks";
import { type KeptCount, marksFor, type Participant } from "./count-view";

/** A count as it is kept, with its key. */
export interface StoredCount extends KeptCount {
  id: string;
}

const announcer = alias(accounts, "announcer");

/** Every mark a count keeps, by the id of the student. */
async function readMarks(db: Database, countId: string): Promise<CountMarks> {
  const rows = await db
    .select()
    .from(dormAttendanceMarks)
    .where(eq(dormAttendanceMarks.countId, countId));
  const marks: CountMarks = {};
  for (const row of rows) {
    marks[row.studentId] = { isAbsent: row.isAbsent, note: row.note };
  }
  return marks;
}

/** The count of an activity on a day, with its marks, or null for none. */
export async function readStoredCount(
  db: Database,
  activityId: string,
  day: string,
): Promise<StoredCount | null> {
  const [count] = await db
    .select({
      id: dormAttendanceCounts.id,
      version: dormAttendanceCounts.version,
      savedAt: dormAttendanceCounts.savedAt,
      announcedAt: dormAttendanceCounts.announcedAt,
      announcedBy: announcer.name,
    })
    .from(dormAttendanceCounts)
    .leftJoin(announcer, eq(announcer.id, dormAttendanceCounts.announcedBy))
    .where(
      and(
        eq(dormAttendanceCounts.activityId, activityId),
        eq(dormAttendanceCounts.day, day),
      ),
    );
  if (!count) return null;
  return { ...count, marks: await readMarks(db, count.id) };
}

/**
 * Holds an activity until the transaction ends, so a second save of one
 * of its counts waits, and then sees what the first one saved. Held
 * without its key, so a count that only names the activity need not wait.
 * False for an activity that does not exist.
 */
export async function lockActivity(
  tx: Database,
  activityId: string,
): Promise<boolean> {
  const [activity] = await tx
    .select({ id: dormActivities.id })
    .from(dormActivities)
    .where(eq(dormActivities.id, activityId))
    .for("no key update");
  return activity !== undefined;
}

/** Adds the count, or gives the one kept its next version. Gives its key and version. */
async function putCount(
  tx: Database,
  actorId: string,
  input: CountInput,
  kept: StoredCount | null,
): Promise<{ id: string; version: number }> {
  const saved = { savedBy: actorId, savedAt: WRITTEN_NOW };
  const announced = input.isAnnouncement
    ? { announcedBy: actorId, announcedAt: WRITTEN_NOW }
    : {};
  if (kept !== null) {
    const version = kept.version + 1;
    await tx
      .update(dormAttendanceCounts)
      .set({ ...saved, ...announced, version })
      .where(eq(dormAttendanceCounts.id, kept.id));
    return { id: kept.id, version };
  }
  const [added] = await tx
    .insert(dormAttendanceCounts)
    .values({
      activityId: input.activityId,
      day: input.day,
      ...saved,
      ...announced,
    })
    .returning({
      id: dormAttendanceCounts.id,
      version: dormAttendanceCounts.version,
    });
  if (!added) throw new Error("The count was not added.");
  return added;
}

async function putMarks(
  tx: Database,
  countId: string,
  marks: CountMarks,
): Promise<void> {
  await tx
    .delete(dormAttendanceMarks)
    .where(eq(dormAttendanceMarks.countId, countId));
  const rows = Object.entries(marks).map(([studentId, mark]) => ({
    countId,
    studentId,
    ...mark,
  }));
  if (rows.length > 0) await tx.insert(dormAttendanceMarks).values(rows);
}

/**
 * Keeps a count of every participant: those the form marks absent or
 * noted as it marks them, every other one Hadir without a note. An
 * announcement is kept with who made it and when, and adds a line to the
 * log with what was announced before, nothing for the first one, and
 * what is announced now. Gives the version of the count.
 */
export async function writeCount(
  tx: Database,
  actorId: string,
  input: CountInput,
  participants: Participant[],
  kept: StoredCount | null,
): Promise<number> {
  const marks = marksFor(participants, input.marks);
  const count = await putCount(tx, actorId, input, kept);
  await putMarks(tx, count.id, marks);
  if (!input.isAnnouncement) return count.version;

  const wasAnnounced = kept !== null && kept.announcedAt !== null;
  await tx.insert(dormAttendanceChanges).values({
    countId: count.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    marksBefore: wasAnnounced ? loggedMarks(kept.marks) : null,
    marksAfter: loggedMarks(marks),
  });
  return count.version;
}
