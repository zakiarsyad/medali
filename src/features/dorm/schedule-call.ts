import { and, count, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormWarningLetterChanges, dormWarningLetters } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { CallSchedule } from "./warning-ids";
import { parseCallSchedule } from "./warning-input";
import {
  ALREADY_ISSUED,
  CALL_CHANGED,
  CALL_MOVED,
  CALL_SENT,
  NOT_CALLED,
  OWN_CALL,
  WARNING_NOT_ALLOWED,
} from "./warning-messages";
import { type CallOf, readCallOf } from "./warning-standing";

/** A call as the form sends it: nothing in it is trusted. */
export interface SentCall {
  studentId: unknown;
  /** The SP the form was drawn for. */
  level: unknown;
  day: unknown;
  time: unknown;
  place: unknown;
}

/**
 * What the account may do to the call of a student: refused, or the SP
 * they are called for now. Shared by scheduling and issuing, which
 * Pengelola Asrama alone does, never for the student their account
 * belongs to, and only for the SP the form was drawn for.
 */
export async function callToChange(
  db: Database,
  actor: AccountForAccess,
  sent: { studentId: unknown; level: unknown },
  now: Date,
): Promise<Parsed<CallOf & { studentId: string }>> {
  if (!may(actor.roles, "issue_dorm_warning_letters")) {
    return WARNING_NOT_ALLOWED;
  }
  const { studentId } = sent;
  if (typeof studentId !== "string" || !isUuid(studentId)) return NOT_CALLED;
  if (studentId === actor.studentId) return OWN_CALL;
  const visible = visibleTo(
    rowLimitForAction(actor, "issue_dorm_warning_letters"),
  );
  const call = await readCallOf(db, visible, studentId, now);
  if (call === null) return NOT_CALLED;
  if (sent.level !== call.level) return CALL_CHANGED;
  return { ok: true, value: { ...call, studentId } };
}

/**
 * Saves the call with its line in the log. One statement adds the call
 * or changes one not issued yet, so of two at the same moment the second
 * waits for the first and changes it after.
 */
function save(
  db: Database,
  actorId: string,
  call: CallOf & { studentId: string },
  schedule: CallSchedule,
): Promise<Parsed<string>> {
  const fields = {
    callDay: schedule.day,
    callTime: schedule.time,
    callPlace: schedule.place,
  };
  return db.transaction(async (tx) => {
    const [letter] = await tx
      .insert(dormWarningLetters)
      .values({
        studentId: call.studentId,
        periodId: call.semesterId,
        level: call.level,
        ...fields,
      })
      .onConflictDoUpdate({
        target: [
          dormWarningLetters.studentId,
          dormWarningLetters.periodId,
          dormWarningLetters.level,
        ],
        set: fields,
        setWhere: isNull(dormWarningLetters.issuedAt),
      })
      .returning({ id: dormWarningLetters.id });
    if (!letter) return ALREADY_ISSUED;
    await tx.insert(dormWarningLetterChanges).values({
      letterId: letter.id,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "scheduled",
      ...fields,
    });
    const [lines] = await tx
      .select({ amount: count() })
      .from(dormWarningLetterChanges)
      .where(
        and(
          eq(dormWarningLetterChanges.letterId, letter.id),
          eq(dormWarningLetterChanges.action, "scheduled"),
        ),
      );
    const isFirst = (lines?.amount ?? 0) === 1;
    return { ok: true, value: isFirst ? CALL_SENT : CALL_MOVED };
  });
}

/**
 * "Kirim panggilan" or "Ubah jadwal" of a resident called for an SP, for
 * Pengelola Asrama only; anyone else is refused before anything is read.
 * The schedule must be whole and to come. A call whose SP is issued is
 * not changed. What was sent comes from outside and is not trusted;
 * `now` is the moment on the server's clock.
 */
export async function scheduleWarningCall(
  db: Database,
  actor: AccountForAccess,
  sent: SentCall,
  now: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "issue_dorm_warning_letters")) {
    return WARNING_NOT_ALLOWED;
  }
  const schedule = parseCallSchedule(sent, now);
  if (!schedule.ok) return schedule;
  const call = await callToChange(db, actor, sent, now);
  if (!call.ok) return call;
  return save(db, actor.id, call.value, schedule.value);
}
