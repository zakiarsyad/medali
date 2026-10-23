import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ASK_NOT_ALLOWED,
  CANCEL_NOT_A_RESIDENT,
  LEAVE_NOT_FOUND,
  tooLateToCancel,
} from "./leave-messages";
import { readStudentDorm } from "./student-dorm";

/**
 * "Batalkan": makes a request of the actor's own student Dibatalkan, with
 * when. Refused for a role that may not ask for leave, for a student who
 * lives in no dorm today, for a request of another student, which is
 * answered as one that is not there, and for a request that no longer
 * waits. The database changes it only while it waits, so a cancel and a
 * decision at the same moment never both win: the second waits for the
 * first, then is refused.
 */
export async function cancelLeave(
  db: Database,
  actor: Pick<Account, "roles" | "studentId">,
  id: string,
  moment: Date = new Date(),
): Promise<Parsed<null>> {
  if (!may(actor.roles, "ask_dorm_leave")) return ASK_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return CANCEL_NOT_A_RESIDENT;
  if (!isUuid(id)) return LEAVE_NOT_FOUND;
  const dorm = await readStudentDorm(db, studentId, campusDay(moment));
  if (dorm === null) return CANCEL_NOT_A_RESIDENT;
  const own = and(eq(dormLeaves.id, id), eq(dormLeaves.studentId, studentId));
  const cancelled = await db
    .update(dormLeaves)
    .set({ status: "cancelled", cancelledAt: WRITTEN_NOW })
    .where(and(own, eq(dormLeaves.status, "submitted")))
    .returning({ id: dormLeaves.id });
  if (cancelled.length > 0) return { ok: true, value: null };
  const [kept] = await db
    .select({ status: dormLeaves.status })
    .from(dormLeaves)
    .where(own);
  if (!kept) return LEAVE_NOT_FOUND;
  return tooLateToCancel(kept.status);
}
