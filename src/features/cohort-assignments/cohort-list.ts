import { and, count, countDistinct, eq, isNull } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  cohortAssignments,
  students,
} from "@/db/schema";
import {
  type AssignmentFacts,
  cohortRows,
  type ListedCohort,
  type WaitingCohort,
} from "./cohort-rows";
import { inProgramsOf, isLimited } from "./visible-assignments";
import { WAITS_FOR_GROUP } from "./waiting-students";

function readWaitingCohorts(
  db: Database,
  limit: RowLimit,
): Promise<WaitingCohort[]> {
  return db
    .select({ cohortYear: students.cohortYear, students: count() })
    .from(students)
    .where(and(WAITS_FOR_GROUP, inProgramsOf(limit, students.studyProgramId)))
    .groupBy(students.cohortYear);
}

/** A member who counts in "Mahasiswa aktif": Aktif and not removed. */
const COUNTED_MEMBER = and(
  eq(students.id, cohortAssignmentMembers.studentId),
  eq(students.status, "active"),
  isNull(students.deletedAt),
);

/**
 * Every penetapan with how many of its groups an account with this limit
 * may see, and how many Aktif students those groups hold.
 */
function readAssignmentFacts(
  db: Database,
  limit: RowLimit,
): Promise<AssignmentFacts[]> {
  const seenGroup = and(
    eq(cohortAssignmentGroups.assignmentId, cohortAssignments.id),
    inProgramsOf(limit, cohortAssignmentGroups.studyProgramId),
  );
  return db
    .select({
      cohortYear: cohortAssignments.cohortYear,
      status: cohortAssignments.status,
      groups: countDistinct(cohortAssignmentGroups.id),
      members: count(students.id),
    })
    .from(cohortAssignments)
    .leftJoin(cohortAssignmentGroups, seenGroup)
    .leftJoin(
      cohortAssignmentMembers,
      eq(cohortAssignmentMembers.groupId, cohortAssignmentGroups.id),
    )
    .leftJoin(students, COUNTED_MEMBER)
    .groupBy(cohortAssignments.id);
}

/**
 * The "Angkatan" list for an account with this limit: see `cohortRows`.
 * The limit is applied where the rows are read, so an account held to its
 * study programs is given the numbers of those programs only.
 */
export async function listCohorts(
  db: Database,
  limit: RowLimit,
): Promise<ListedCohort[]> {
  const [waiting, assignments] = await Promise.all([
    readWaitingCohorts(db, limit),
    readAssignmentFacts(db, limit),
  ]);
  return cohortRows(waiting, assignments, isLimited(limit));
}
