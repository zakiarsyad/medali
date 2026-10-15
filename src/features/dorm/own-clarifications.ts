import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarifications,
} from "@/db/schema";
import { removedFileWords } from "@/ui/removed-file";
import type { AcceptedClarification } from "./clarification-effect";
import { type ShownClarification, shownNote } from "./clarification-time";
import { heldKey } from "./history";

/**
 * The newest clarification of a resident for each activity on a day from
 * `fromDay` on, by the key of the activity on its day. Their file is
 * named only where one is kept.
 */
export async function readOwnClarifications(
  db: Database,
  studentId: string,
  fromDay: string,
): Promise<Map<string, ShownClarification>> {
  const rows = await db
    .select({
      id: dormClarifications.id,
      activityId: dormAttendanceCounts.activityId,
      day: dormAttendanceCounts.day,
      status: dormClarifications.status,
      verifyNote: dormClarifications.verifyNote,
      decisionNote: dormClarifications.decisionNote,
      fileKey: dormClarifications.fileKey,
      fileName: dormClarifications.fileName,
      fileRemovedAt: dormClarifications.fileRemovedAt,
    })
    .from(dormClarifications)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormClarifications.countId),
    )
    .where(
      and(
        eq(dormClarifications.studentId, studentId),
        gte(dormAttendanceCounts.day, fromDay),
      ),
    )
    .orderBy(desc(dormClarifications.sentAt));
  const newest = new Map<string, ShownClarification>();
  for (const row of rows) {
    const key = heldKey(row);
    if (newest.has(key)) continue;
    const isKept = row.fileKey !== null && row.fileRemovedAt === null;
    newest.set(key, {
      id: row.id,
      status: row.status,
      note: shownNote(row.status, row.verifyNote, row.decisionNote),
      fileName: isKept ? row.fileName : null,
      removed: removedFileWords(row.fileRemovedAt),
    });
  }
  return newest;
}

/**
 * The accepted clarifications of a resident, of all time, each with
 * their mark in the count as it is now. One of a count that no longer
 * holds them is left out.
 */
export async function readOwnAccepted(
  db: Database,
  studentId: string,
): Promise<AcceptedClarification[]> {
  const rows = await db
    .select({
      activityId: dormAttendanceCounts.activityId,
      day: dormAttendanceCounts.day,
      isAbsent: dormAttendanceMarks.isAbsent,
      acceptedAs: dormClarifications.acceptedAs,
      reason: dormClarifications.reason,
    })
    .from(dormClarifications)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormClarifications.countId),
    )
    .innerJoin(
      dormAttendanceMarks,
      and(
        eq(dormAttendanceMarks.countId, dormClarifications.countId),
        eq(dormAttendanceMarks.studentId, dormClarifications.studentId),
      ),
    )
    .where(
      and(
        eq(dormClarifications.studentId, studentId),
        eq(dormClarifications.status, "accepted"),
        isNotNull(dormAttendanceCounts.announcedAt),
      ),
    );
  const accepted: AcceptedClarification[] = [];
  for (const row of rows) {
    if (row.acceptedAs === null) continue;
    accepted.push({
      key: heldKey(row),
      studentId,
      isAbsent: row.isAbsent,
      acceptedAs: row.acceptedAs,
      reason: row.reason,
    });
  }
  return accepted;
}

/** The status of every clarification of a resident, of all time. */
export async function readOwnStatuses(db: Database, studentId: string) {
  const rows = await db
    .select({ status: dormClarifications.status })
    .from(dormClarifications)
    .where(eq(dormClarifications.studentId, studentId));
  return rows.map((row) => row.status);
}
