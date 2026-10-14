import { and, desc, eq, gte } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormAttendanceCounts, dormClarifications } from "@/db/schema";
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
    newest.set(key, {
      id: row.id,
      status: row.status,
      note: shownNote(row.status, row.verifyNote, row.decisionNote),
      fileName: row.fileKey === null ? null : row.fileName,
    });
  }
  return newest;
}

/** The status of every clarification of a resident, of all time. */
export async function readOwnStatuses(db: Database, studentId: string) {
  const rows = await db
    .select({ status: dormClarifications.status })
    .from(dormClarifications)
    .where(eq(dormClarifications.studentId, studentId));
  return rows.map((row) => row.status);
}
