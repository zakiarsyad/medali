import { and, eq, lte } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCleaningChanges, dormCleaningDuties } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { type Judgement, parseJudgement } from "./cleaning-assessment";
import {
  ASSESSED_DUTY_NOT_FOUND,
  JUDGE_NOT_ALLOWED,
  JUDGED_FIRST,
  JUDGED_TOO_EARLY,
  JUDGED_WORDS,
} from "./cleaning-messages";

type Judge = Pick<Account, "id" | "roles">;

/** What "Memenuhi" or "Tidak memenuhi" sends, not trusted. */
export interface SentJudgement {
  dutyId: string;
  result: unknown;
  note: unknown;
}

/** Why a duty was not judged: it is not there, not due yet, or judged first. */
async function whyNotJudged(
  tx: Database,
  dutyId: string,
  today: string,
): Promise<{ ok: false; error: string }> {
  const [kept] = await tx
    .select({ day: dormCleaningDuties.day })
    .from(dormCleaningDuties)
    .where(eq(dormCleaningDuties.id, dutyId));
  if (!kept) return ASSESSED_DUTY_NOT_FOUND;
  if (kept.day > today) return JUDGED_TOO_EARLY;
  return JUDGED_FIRST;
}

async function judgeIn(
  tx: Database,
  judge: Judge,
  dutyId: string,
  judgement: Judgement,
  today: string,
): Promise<Parsed<string>> {
  const [judged] = await tx
    .update(dormCleaningDuties)
    .set({
      status: "judged",
      result: judgement.result,
      judgeNote: judgement.note,
      judgedBy: judge.id,
      judgedAt: WRITTEN_NOW,
    })
    .where(
      and(
        eq(dormCleaningDuties.id, dutyId),
        eq(dormCleaningDuties.status, "scheduled"),
        lte(dormCleaningDuties.day, today),
      ),
    )
    .returning({ judgedAt: dormCleaningDuties.judgedAt });
  if (!judged) return whyNotJudged(tx, dutyId, today);
  await tx.insert(dormCleaningChanges).values({
    dutyId,
    changedBy: judge.id,
    changedAt: judged.judgedAt ?? undefined,
    step: "judged",
    result: judgement.result,
    note: judgement.note,
  });
  return { ok: true, value: JUDGED_WORDS[judgement.result] };
}

/**
 * "Memenuhi" or "Tidak memenuhi" of BAM - BPHK or BAM - Kerumahtanggaan
 * on a duty that is Terjadwal, from its date on, with its Catatan and its
 * line in the log, all or nothing. Tidak memenuhi needs a note. Refused
 * to a role without the right, Pengelola Asrama and BAM - KI among them.
 * The database changes a duty only while it is Terjadwal, so of two
 * judgements at once the second waits for the first, then is refused.
 * `today` is the day on campus.
 */
export async function judgeDuty(
  db: Database,
  judge: Judge,
  sent: SentJudgement,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!may(judge.roles, "judge_dorm_cleaning")) return JUDGE_NOT_ALLOWED;
  if (!isUuid(sent.dutyId)) return ASSESSED_DUTY_NOT_FOUND;
  const judgement = parseJudgement(sent.result, sent.note);
  if (!judgement.ok) return judgement;
  return db.transaction((tx) =>
    judgeIn(tx, judge, sent.dutyId, judgement.value, today),
  );
}
