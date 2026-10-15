import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCleaningChanges, dormCleaningDuties } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { dayWords } from "./activity-words";
import { parseSendBackReason } from "./cleaning-assessment";
import {
  ASSESSED_DUTY_NOT_FOUND,
  DECIDED_FIRST,
  NOT_JUDGED_YET,
  SENT_BACK,
  VALIDATE_NOT_ALLOWED,
  VALIDATED_MET,
  VALIDATED_WITHOUT_REPEAT,
  validatedNotMet,
} from "./cleaning-messages";
import { scheduleRepeat } from "./cleaning-repeat";

type Validator = Pick<Account, "id" | "roles">;

/**
 * Why a duty was not decided: it is not there, it is not judged yet, or
 * someone decided it first.
 */
async function whyNotDecided(
  tx: Database,
  dutyId: string,
): Promise<{ ok: false; error: string }> {
  const [kept] = await tx
    .select({ status: dormCleaningDuties.status })
    .from(dormCleaningDuties)
    .where(eq(dormCleaningDuties.id, dutyId));
  if (!kept) return ASSESSED_DUTY_NOT_FOUND;
  if (kept.status === "scheduled") return NOT_JUDGED_YET;
  return DECIDED_FIRST;
}

const IS_JUDGED = eq(dormCleaningDuties.status, "judged");

async function validateIn(
  tx: Database,
  validator: Validator,
  dutyId: string,
  today: string,
): Promise<Parsed<string>> {
  const [duty] = await tx
    .update(dormCleaningDuties)
    .set({
      status: "validated",
      validatedBy: validator.id,
      validatedAt: WRITTEN_NOW,
    })
    .where(and(eq(dormCleaningDuties.id, dutyId), IS_JUDGED))
    .returning();
  if (!duty) return whyNotDecided(tx, dutyId);
  // The database keeps a result on every judged duty.
  if (!duty.result) throw new Error("A judged cleaning duty has no result.");
  await tx.insert(dormCleaningChanges).values({
    dutyId,
    changedBy: validator.id,
    changedAt: duty.validatedAt ?? undefined,
    step: "validated",
    result: duty.result,
    note: "",
  });
  if (duty.result === "met") return { ok: true, value: VALIDATED_MET };

  const repeatOn = await scheduleRepeat(tx, duty, validator.id, today);
  if (repeatOn === null) return { ok: true, value: VALIDATED_WITHOUT_REPEAT };
  return { ok: true, value: validatedNotMet(dayWords(repeatOn)) };
}

/**
 * "Validasi" of Pengelola Asrama on a duty that is Dinilai BAM: it becomes
 * Divalidasi, which gives its room +1 for Memenuhi or −1 for Tidak
 * memenuhi, and a Tidak memenuhi puts the same place and room on the
 * schedule again. All of it, with its line in the log, or nothing.
 * Refused to a role without the right, the BAM roles among them. The
 * database changes a duty only while it is Dinilai BAM, so of two
 * decisions at once the second waits for the first, then is refused, and
 * the room gets one point and one repeat. `today` is the day on campus.
 */
export async function validateDuty(
  db: Database,
  validator: Validator,
  dutyId: string,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(validator.roles, "validate_dorm_cleaning")) {
    return VALIDATE_NOT_ALLOWED;
  }
  if (!isUuid(dutyId)) return ASSESSED_DUTY_NOT_FOUND;
  return db.transaction((tx) => validateIn(tx, validator, dutyId, today));
}

/**
 * The result of a duty that is Dinilai BAM, held until the change ends so
 * the log names the result that was sent back; null for any other duty.
 */
async function lockJudged(tx: Database, dutyId: string) {
  const [duty] = await tx
    .select({ result: dormCleaningDuties.result })
    .from(dormCleaningDuties)
    .where(and(eq(dormCleaningDuties.id, dutyId), IS_JUDGED))
    .for("update");
  return duty?.result ?? null;
}

async function sendBackIn(
  tx: Database,
  validator: Validator,
  dutyId: string,
  reason: string,
): Promise<Parsed<string>> {
  const result = await lockJudged(tx, dutyId);
  if (!result) return whyNotDecided(tx, dutyId);
  const [sent] = await tx
    .update(dormCleaningDuties)
    .set({
      status: "scheduled",
      result: null,
      judgeNote: "",
      judgedBy: null,
      judgedAt: null,
      sentBackReason: reason,
      sentBackBy: validator.id,
      sentBackAt: WRITTEN_NOW,
    })
    .where(and(eq(dormCleaningDuties.id, dutyId), IS_JUDGED))
    .returning({ sentBackAt: dormCleaningDuties.sentBackAt });
  if (!sent) return whyNotDecided(tx, dutyId);
  await tx.insert(dormCleaningChanges).values({
    dutyId,
    changedBy: validator.id,
    changedAt: sent.sentBackAt ?? undefined,
    step: "sent_back",
    result,
    note: reason,
  });
  return { ok: true, value: SENT_BACK };
}

/**
 * "Tolak penilaian" of Pengelola Asrama on a duty that is Dinilai BAM,
 * with a reason of at least 5 letters: the duty goes back to Terjadwal for
 * BAM to judge again, showing the reason. The judgement sent back stays
 * in the log with the reason. Refused to a role without the right; of two
 * decisions at once the second waits for the first, then is refused.
 */
export async function sendBackDuty(
  db: Database,
  validator: Validator,
  dutyId: string,
  reason: unknown,
): Promise<Parsed<string>> {
  if (!may(validator.roles, "validate_dorm_cleaning")) {
    return VALIDATE_NOT_ALLOWED;
  }
  if (!isUuid(dutyId)) return ASSESSED_DUTY_NOT_FOUND;
  const checked = parseSendBackReason(reason);
  if (!checked.ok) return checked;
  return db.transaction((tx) =>
    sendBackIn(tx, validator, dutyId, checked.value),
  );
}
