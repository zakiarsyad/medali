import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  students,
} from "@/db/schema";
import { addLogLine } from "./assignment-writes";

/**
 * A student who has left a draft: removed, or not Aktif any more. It is
 * what the students who wait for a group leave out as well, so a draft
 * never holds someone the angkatan does not count.
 */
export const LEFT_DRAFT = sql<boolean>`(
  ${students.status} <> 'active' or ${students.deletedAt} is not null
)`;

/** The note on a draft that lost students. It counts them and names nobody. */
export function droppedWords(dropped: number): string {
  return `${dropped} mahasiswa dikeluarkan dari draf karena sudah dihapus atau tidak aktif lagi.`;
}

/**
 * Takes the students who have left a draft out of its stored groups, and
 * says so in "Riwayat proses" when there were any. Reading a draft
 * already leaves them out and writes nothing, since a page may be opened
 * by a role that only reads; the rows go with the next save.
 */
export async function dropLeftMembers(
  tx: Database,
  assignmentId: string,
  actorId: string,
): Promise<void> {
  const groupsOfDraft = tx
    .select({ id: cohortAssignmentGroups.id })
    .from(cohortAssignmentGroups)
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
  const left = tx.select({ id: students.id }).from(students).where(LEFT_DRAFT);
  const dropped = await tx
    .delete(cohortAssignmentMembers)
    .where(
      and(
        inArray(cohortAssignmentMembers.groupId, groupsOfDraft),
        inArray(cohortAssignmentMembers.studentId, left),
      ),
    )
    .returning({ id: cohortAssignmentMembers.studentId });
  if (dropped.length === 0) return;
  await addLogLine(tx, assignmentId, actorId, "members_dropped");
}
