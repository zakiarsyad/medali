import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { mentalHealthScreeningLog, mentalHealthScreenings } from "@/db/schema";
import { screeningResult } from "@/mental-health/screening-rules";
import {
  CONSENT_NEEDED,
  FORM_STALE,
  SCREENING_NOT_ALLOWED,
  savedMessage,
} from "@/mental-health/screening-words";
import { readConsentOf } from "./consent-reads";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { screenableStudentName } from "./screening-consent";
import {
  type CheckedScreening,
  checkScreening,
  type SentScreening,
} from "./screening-input";
import { screeningReachOf } from "./screening-reach";

/** What "Simpan asesmen" gives back: nothing is saved on a refusal. */
export type ScreeningOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

function refused(error: string): ScreeningOutcome {
  return { kind: "refused", error };
}

/** Keeps the screening under the form's key; false when that key is kept already. */
async function keepScreening(
  tx: Database,
  actorId: string,
  key: string,
  checked: CheckedScreening,
  at: Date,
): Promise<boolean> {
  const { studentId, screenedOn, scores, note } = checked;
  const result = screeningResult(scores);
  const [added] = await tx
    .insert(mentalHealthScreenings)
    .values({
      id: key,
      studentId,
      screenedOn,
      instrument: scores.instrument,
      depression: scores.instrument === "dass21" ? scores.depression : null,
      anxiety: scores.instrument === "dass21" ? scores.anxiety : null,
      stress: scores.instrument === "dass21" ? scores.stress : null,
      srqYes: scores.instrument === "srq20" ? scores.srqYes : null,
      selfHarm: scores.selfHarm,
      level: result.level,
      note,
      savedBy: actorId,
      savedAt: at,
    })
    .onConflictDoNothing()
    .returning({ id: mentalHealthScreenings.id });
  return added !== undefined;
}

/** Whether the screening kept under the key is this account's, for this student. */
async function keptForSameForm(
  tx: Database,
  actorId: string,
  key: string,
  studentId: string,
): Promise<boolean> {
  const [kept] = await tx
    .select({ id: mentalHealthScreenings.id })
    .from(mentalHealthScreenings)
    .where(
      and(
        eq(mentalHealthScreenings.id, key),
        eq(mentalHealthScreenings.studentId, studentId),
        eq(mentalHealthScreenings.savedBy, actorId),
      ),
    );
  return kept !== undefined;
}

/**
 * "Simpan asesmen": a screening of a student whose consent to counselling
 * is Disetujui, with the level worked out here, and a line in the log
 * with who and when and nothing of the screening. The key is made by the
 * form, so a form sent twice is kept once. Refused, saving nothing, for
 * an account without the right, a student it may not screen, a consent
 * that is not Disetujui, and anything wrong in what was sent.
 */
export async function saveScreening(
  db: Database,
  actor: AccountForAccess,
  key: unknown,
  sent: SentScreening,
  now: Date = new Date(),
): Promise<ScreeningOutcome> {
  if (screeningReachOf(actor) === null) return refused(SCREENING_NOT_ALLOWED);
  if (typeof key !== "string" || !isUuid(key)) return refused(FORM_STALE);
  const checked = checkScreening(sent, campusDay(now));
  if (!checked.ok) return refused(checked.error);
  const { studentId } = checked.value;
  return db.transaction(async (tx) => {
    const name = await screenableStudentName(tx, actor, studentId, true);
    if (name === null) return refused(STUDENT_NOT_FOUND);
    const consent = await readConsentOf(tx, studentId);
    if (consent?.status !== "approved") return refused(CONSENT_NEEDED);
    if (await keepScreening(tx, actor.id, key, checked.value, now)) {
      await tx
        .insert(mentalHealthScreeningLog)
        .values({ studentId, event: "saved", by: actor.id, at: now });
    } else if (!(await keptForSameForm(tx, actor.id, key, studentId))) {
      return refused(FORM_STALE);
    }
    return { kind: "kept", done: savedMessage(name) };
  });
}
