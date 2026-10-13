import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  mentoringAttendance,
  mentoringMeetingChanges,
  mentoringMeetings,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { MarksByStudent } from "@/mentoring/meeting-ids";
import type { AttendanceInput } from "./attendance-input";
import { sameMarks } from "./attendance-marks";

export type KeptMeeting = typeof mentoringMeetings.$inferSelect;

/** Every mark kept for a meeting, by the id of the student. */
export async function readMarksOf(
  tx: Database,
  meetingId: string,
): Promise<MarksByStudent> {
  const rows = await tx
    .select()
    .from(mentoringAttendance)
    .where(eq(mentoringAttendance.meetingId, meetingId));
  const marks: MarksByStudent = {};
  for (const row of rows) marks[row.studentId] = row.mark;
  return marks;
}

/**
 * Keeps these marks for a meeting. A student who has a mark there gets
 * the new one in its place; a mark of a student who is not named stays.
 */
async function putMarks(
  tx: Database,
  meetingId: string,
  marks: MarksByStudent,
): Promise<void> {
  const rows = Object.entries(marks).map(([studentId, mark]) => ({
    meetingId,
    studentId,
    mark,
  }));
  if (rows.length === 0) return;
  await tx
    .insert(mentoringAttendance)
    .values(rows)
    .onConflictDoUpdate({
      target: [mentoringAttendance.meetingId, mentoringAttendance.studentId],
      set: { mark: sql`excluded.mark` },
    });
}

/**
 * Adds the meeting with its marks, and the first line of its log, which
 * has nothing before. Gives the version of the list: the first.
 */
export async function addMeeting(
  tx: Database,
  actorId: string,
  periodId: string,
  input: AttendanceInput,
): Promise<number> {
  const { groupId, number, heldOn, topic, marks } = input;
  const [added] = await tx
    .insert(mentoringMeetings)
    .values({
      groupId,
      periodId,
      number,
      heldOn,
      topic,
      savedBy: actorId,
      savedAt: WRITTEN_NOW,
    })
    .returning({
      id: mentoringMeetings.id,
      version: mentoringMeetings.version,
    });
  if (!added) throw new Error("The meeting was not added.");
  await putMarks(tx, added.id, marks);
  await tx.insert(mentoringMeetingChanges).values({
    meetingId: added.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    heldOnAfter: heldOn,
    topicAfter: topic,
    marksAfter: marks,
  });
  return added.version;
}

/**
 * Puts the new list in the place of the one kept for a meeting, and adds
 * a line to the log with the day, the topic and every mark before and
 * after. `marksBefore` is every mark kept for it. A mark kept for a
 * student the new list does not name, one who has left the group, stays
 * as it was. A save that changes nothing writes nothing: no new version,
 * no log line. Gives the version of the list.
 */
export async function correctMeeting(
  tx: Database,
  actorId: string,
  kept: KeptMeeting,
  marksBefore: MarksByStudent,
  input: AttendanceInput,
): Promise<number> {
  const { heldOn, topic } = input;
  const marksAfter = { ...marksBefore, ...input.marks };
  const isUnchanged =
    kept.heldOn === heldOn &&
    kept.topic === topic &&
    sameMarks(marksBefore, marksAfter);
  if (isUnchanged) return kept.version;

  const version = kept.version + 1;
  await tx
    .update(mentoringMeetings)
    .set({ heldOn, topic, version, savedBy: actorId, savedAt: WRITTEN_NOW })
    .where(eq(mentoringMeetings.id, kept.id));
  await putMarks(tx, kept.id, input.marks);
  await tx.insert(mentoringMeetingChanges).values({
    meetingId: kept.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    heldOnBefore: kept.heldOn,
    topicBefore: kept.topic,
    marksBefore,
    heldOnAfter: heldOn,
    topicAfter: topic,
    marksAfter,
  });
  return version;
}
