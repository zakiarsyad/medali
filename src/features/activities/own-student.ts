import { and, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { CandidateStudent } from "./chosen-participants";

/**
 * The student an account sends attendance photos as, with what tells
 * which schedules are meant for them. Only an Aktif student takes part.
 */
export type OwnStudent = CandidateStudent;

/**
 * The one student whose attendance an account may see and send: its own.
 * Which student is never asked from outside. Null for an account without
 * the right, for one whose rows are not exactly its own student, as a
 * wider role's would be, and for a removed student.
 */
export async function readOwnStudent(
  db: Database,
  account: AccountForAccess,
): Promise<OwnStudent | null> {
  if (!may(account.roles, "send_attendance_photo")) return null;
  const limit = rowLimitForAction(account, "send_attendance_photo");
  if (limit.kind !== "some") return null;
  const [ownId, ...others] = limit.studentIds;
  if (ownId === undefined || others.length > 0) return null;

  const [student] = await db
    .select({
      id: students.id,
      cohortYear: students.cohortYear,
      className: students.className,
      status: students.status,
    })
    .from(students)
    .where(and(eq(students.id, ownId), isNull(students.deletedAt)));
  if (!student) return null;
  return {
    id: student.id,
    cohortYear: student.cohortYear,
    className: student.className,
    isActive: student.status === "active",
  };
}
