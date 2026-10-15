import { isNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { dormWarningLetterChanges, dormWarningLetters } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { callToChange } from "./schedule-call";
import { type IssueText, parseIssue } from "./warning-input";
import {
  ALREADY_ISSUED,
  SP1_ISSUED,
  SP2_ISSUED,
  WARNING_NOT_ALLOWED,
} from "./warning-messages";
import type { CallOf } from "./warning-standing";

/** An SP as the form sends it: nothing in it is trusted. */
export interface SentIssue {
  studentId: unknown;
  /** The SP the form was drawn for. */
  level: unknown;
  result: unknown;
  proposalNote: unknown;
}

/**
 * Saves the SP with its line in the log, which keeps the schedule of the
 * call, empty for an SP issued without one. One statement adds the SP or
 * issues the call not issued yet, so of two at the same moment the
 * second waits for the first, then finds it issued.
 */
function save(
  db: Database,
  actorId: string,
  call: CallOf & { studentId: string },
  text: IssueText,
  at: Date,
): Promise<Parsed<string>> {
  const issued = { ...text, issuedBy: actorId, issuedAt: at };
  return db.transaction(async (tx) => {
    const [letter] = await tx
      .insert(dormWarningLetters)
      .values({
        studentId: call.studentId,
        periodId: call.semesterId,
        level: call.level,
        ...issued,
      })
      .onConflictDoUpdate({
        target: [
          dormWarningLetters.studentId,
          dormWarningLetters.periodId,
          dormWarningLetters.level,
        ],
        set: issued,
        setWhere: isNull(dormWarningLetters.issuedAt),
      })
      .returning({
        id: dormWarningLetters.id,
        callDay: dormWarningLetters.callDay,
        callTime: dormWarningLetters.callTime,
        callPlace: dormWarningLetters.callPlace,
      });
    if (!letter) return ALREADY_ISSUED;
    await tx.insert(dormWarningLetterChanges).values({
      letterId: letter.id,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "issued",
      callDay: letter.callDay,
      callTime: letter.callTime,
      callPlace: letter.callPlace,
    });
    return { ok: true, value: call.level === 1 ? SP1_ISSUED : SP2_ISSUED };
  });
}

/**
 * "Terbitkan SP 1", or "Terbitkan SP 2 dan ajukan hukuman disiplin" with
 * the proposal for Kepala Unit, of a resident called for that SP, for
 * Pengelola Asrama only; anyone else is refused before anything is read.
 * An SP may be issued without a call. An issued SP is never changed, so
 * a second press saves nothing more. What was sent comes from outside
 * and is not trusted; `now` is the moment on the server's clock.
 */
export async function issueWarningLetter(
  db: Database,
  actor: AccountForAccess,
  sent: SentIssue,
  now: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "issue_dorm_warning_letters")) {
    return WARNING_NOT_ALLOWED;
  }
  const call = await callToChange(db, actor, sent, now);
  if (!call.ok) return call;
  const text = parseIssue(sent, call.value.level);
  if (!text.ok) return text;
  return save(db, actor.id, call.value, text.value, now);
}
