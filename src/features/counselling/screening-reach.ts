import { and, ne, type SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { students } from "@/db/schema";

/**
 * The students whose screenings the account may record and read, as a
 * condition on the students, never the account's own student; null for
 * an account without the right, which is then given nothing of a
 * screening.
 */
export function screeningReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "record_mental_health_screenings")) return null;
  const visible = visibleTo(
    rowLimitForAction(actor, "record_mental_health_screenings"),
  );
  if (actor.studentId === null) return visible;
  return and(visible, ne(students.id, actor.studentId)) ?? visible;
}
