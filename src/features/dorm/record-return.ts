import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { shownMoment } from "@/ui/day";
import { LEAVE_NOT_FOUND } from "./leave-messages";
import { momentOf } from "./leave-time";
import {
  RECORD_NOT_ALLOWED,
  RETURN_TIME_NEEDED,
  returnRecordedWords,
} from "./return-messages";
import { lateMinutes, recordFault } from "./return-rules";
import { hasOpenReport, lockLeave } from "./return-store";

async function record(
  tx: Database,
  actor: Pick<Account, "id">,
  leaveId: string,
  returnedAt: Date,
  now: Date,
): Promise<Parsed<string>> {
  const leave = await lockLeave(tx, leaveId);
  if (!leave) return LEAVE_NOT_FOUND;
  const waits = await hasOpenReport(tx, leaveId);
  const fault = recordFault(leave, waits, returnedAt, now);
  if (fault !== null) return fault;
  await tx
    .update(dormLeaves)
    .set({ status: "completed", returnedAt, returnRecordedBy: actor.id })
    .where(and(eq(dormLeaves.id, leaveId), eq(dormLeaves.status, "approved")));
  const late = lateMinutes(returnedAt, leave.endsAt);
  return {
    ok: true,
    value: returnRecordedWords(shownMoment(returnedAt), late),
  };
}

/**
 * "Catat sudah kembali": makes leave that is out Selesai, back at
 * "Waktu kembali", a time on campus such as 2026-10-14T16:20, with who
 * recorded it. A time after `now`, the moment on the server's clock, or
 * before the departure is refused, and so is leave with a report that
 * waits, which is checked instead. Refused for a role that may not
 * record. It holds the leave first, so of two returns recorded at once,
 * or a return and a validation, the second waits for the first, then is
 * refused.
 */
export async function recordReturn(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  leaveId: string,
  sentTime: string,
  now: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "record_dorm_return")) return RECORD_NOT_ALLOWED;
  if (!isUuid(leaveId)) return LEAVE_NOT_FOUND;
  const returnedAt = momentOf(sentTime);
  if (returnedAt === null) return RETURN_TIME_NEEDED;
  return db.transaction((tx) => record(tx, actor, leaveId, returnedAt, now));
}
