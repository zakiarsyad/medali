import { and, eq } from "drizzle-orm";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { counsellingConsents, students } from "@/db/schema";

/**
 * Whether the student is one Konselor may keep sessions of: any student
 * that is not removed. What was sent comes from outside.
 */
export async function isSessionStudent(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<boolean> {
  if (typeof studentId !== "string" || !isUuid(studentId)) return false;
  const scope = visibleTo(
    rowLimitForAction(actor, "keep_counselling_sessions"),
  );
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), scope));
  return found !== undefined;
}

/**
 * Whether the student's consent is Disetujui. It is held until the
 * transaction ends, so a withdrawal at the same moment waits and the
 * session is never written after it.
 */
export async function holdsConsent(
  tx: Database,
  studentId: string,
): Promise<boolean> {
  const [consent] = await tx
    .select({ status: counsellingConsents.status })
    .from(counsellingConsents)
    .where(eq(counsellingConsents.studentId, studentId))
    .for("share");
  return consent?.status === "approved";
}
