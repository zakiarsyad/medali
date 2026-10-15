import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityClarifications } from "@/db/schema";
import { removedFileWords } from "@/ui/removed-file";
import type { ShownClarification } from "./clarification-time";

/** Whether a file is kept is asked, not where: the place of a file stays on the server. */
const SHOWN = {
  id: activityClarifications.id,
  scheduleId: activityClarifications.scheduleId,
  status: activityClarifications.status,
  note: activityClarifications.note,
  fileName: activityClarifications.fileName,
  hasFile: isNotNull(activityClarifications.fileKey).mapWith(Boolean),
  removedAt: activityClarifications.fileRemovedAt,
};

/**
 * The newest clarification of one student for each of some schedules.
 * The student is the one the account's own rows hold, never one asked
 * for from outside. `keepsFiles` is whether this place has a file
 * storage: without one, and for a sample clarification whose file was
 * never kept, there is no file to open.
 */
export async function readOwnClarifications(
  db: Database,
  studentId: string,
  scheduleIds: readonly string[],
  keepsFiles: boolean,
): Promise<Map<string, ShownClarification>> {
  const newest = new Map<string, ShownClarification>();
  if (scheduleIds.length === 0) return newest;
  const rows = await db
    .select(SHOWN)
    .from(activityClarifications)
    .where(
      and(
        eq(activityClarifications.studentId, studentId),
        inArray(activityClarifications.scheduleId, [...new Set(scheduleIds)]),
      ),
    )
    .orderBy(desc(activityClarifications.sentAt));
  for (const row of rows) {
    if (newest.has(row.scheduleId)) continue;
    const canBeOpened = keepsFiles && row.hasFile && row.removedAt === null;
    newest.set(row.scheduleId, {
      status: row.status,
      note: row.note,
      file: canBeOpened
        ? { clarificationId: row.id, name: row.fileName }
        : null,
      removed: removedFileWords(row.removedAt),
    });
  }
  return newest;
}
