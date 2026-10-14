import { and, count, countDistinct, eq, isNull } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignments,
  students,
} from "@/db/schema";
import {
  type AssignmentFacts,
  cohortRows,
  type ListedCohort,
  type WaitingCohort,
} from "./cohort-rows";
import { membersToday } from "./members-today";
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

/**
 * Every penetapan with how many of its groups an account with this limit
 * may see, and how many students those groups hold today: see
 * `membersToday`. Only a member who counts in "Mahasiswa aktif" is
 * counted: Aktif and not removed.
 */
function readAssignmentFacts(
  db: Database,
  limit: RowLimit,
): Promise<AssignmentFacts[]> {
  const seenGroup = and(
    eq(cohortAssignmentGroups.assignmentId, cohortAssignments.id),
    inProgramsOf(limit, cohortAssignmentGroups.studyProgramId),
  );
  const today = membersToday(db);
  const countedMember = and(
    eq(students.id, today.studentId),
    eq(students.status, "active"),
    isNull(students.deletedAt),
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
    .leftJoin(today, eq(today.groupId, cohortAssignmentGroups.id))
    .leftJoin(students, countedMember)
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
