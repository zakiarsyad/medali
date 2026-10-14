import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  students,
} from "@/db/schema";

/**
 * Holds the record of every student the stored groups of a draft name,
 * until the transaction ends. A save or a removal of one of them on
 * Pengguna baru mahasiswa holds the same record, so it waits for the
 * penetapan, or the penetapan waits for it and then reads what it left.
 * A removed student is held like the others: their removal may be the
 * save that has not ended yet.
 */
export async function holdDraftStudents(
  tx: Database,
  assignmentId: string,
): Promise<void> {
  const membersOfDraft = tx
    .select({ id: cohortAssignmentMembers.studentId })
    .from(cohortAssignmentMembers)
    .innerJoin(
      cohortAssignmentGroups,
      eq(cohortAssignmentGroups.id, cohortAssignmentMembers.groupId),
    )
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
  await tx
    .select({ id: students.id })
    .from(students)
    .where(inArray(students.id, membersOfDraft))
    // Always in the same order: two saves that hold several students
    // would otherwise each wait for a student the other holds, until the
    // database gives one of them up.
    .orderBy(asc(students.id))
    // Not the stronger "update": that one also stops lines that point at
    // a student from being written, such as the member lines of another
    // penetapan cancelled at the same moment, or a line of a log.
    .for("no key update");
}
