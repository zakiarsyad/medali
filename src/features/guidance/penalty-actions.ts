"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import {
  changePenaltyCondition,
  changePenaltyDecision,
  changePenaltyStatus,
} from "./follow-up-discipline-penalty";
import { PENALTIES_ADDRESS } from "./penalty-address";
import { readUnfinishedWork } from "./penalty-board";
import type { PenaltyHistory } from "./penalty-consequences";
import { type OpenedPenalty, readPenaltyDetail } from "./penalty-detail-read";
import type { FollowUpOutcome, FollowUpState } from "./penalty-follow-up";
import { CONFIRMED } from "./penalty-input";
import {
  CONDITION_SAVED,
  DECISION_RECORDED,
  STATUS_UPDATED,
  savedMessage,
} from "./penalty-messages";
import {
  type PenaltyPick,
  readPenaltyHistory,
  searchPenaltyStudents,
} from "./penalty-student";
import { saveDisciplinePenalty } from "./save-discipline-penalty";

/**
 * The signed-in account when it may record discipline penalties. Any
 * other is refused before anything of what it sent is read.
 */
async function recorder(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "record_discipline_penalties"))
    forbidden();
  return account;
}

/**
 * The signed-in account when it may follow up discipline penalties. Any
 * other is refused before anything of what it sent is read.
 */
async function follower(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "follow_up_discipline_penalties"))
    forbidden();
  return account;
}

/**
 * The signed-in account when it may read discipline records. Any other
 * is refused before anything of what it sent is read.
 */
async function reader(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "view_discipline_records")) forbidden();
  return account;
}

/**
 * "Rincian" of one penalty of "Daftar pelanggaran", read when it is
 * opened; null for a penalty that is not the account's to see.
 */
export async function openPenaltyAction(
  penaltyId: string,
): Promise<OpenedPenalty | null> {
  const actor = await reader();
  return readPenaltyDetail(database(), actor, String(penaltyId));
}

/** "Mahasiswa" of "Catat pelanggaran": the students found for the text typed. */
export async function searchPenaltyStudentsAction(
  query: string,
): Promise<PenaltyPick[]> {
  const actor = await recorder();
  return searchPenaltyStudents(database(), actor, query);
}

/**
 * The history of the student picked, for "Konsekuensi"; null when not
 * theirs to record.
 */
export async function penaltyHistoryAction(
  studentId: string,
): Promise<PenaltyHistory | null> {
  const actor = await recorder();
  return readPenaltyHistory(database(), actor, String(studentId));
}

/** "Simpan pelanggaran". Who recorded it is the signed-in account, never a field. */
export async function saveDisciplinePenaltyAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await recorder();
  const saved = await saveDisciplinePenalty(
    database(),
    actor,
    text(form, "id"),
    {
      studentId: text(form, "studentId"),
      day: text(form, "day"),
      description: text(form, "description"),
      category: text(form, "category"),
      level: text(form, "level"),
      decisionNumber: text(form, "decisionNumber"),
      socialWorkForms: texts(form, "socialWorkForms"),
      socialWorkOther: text(form, "socialWorkOther"),
      socialWorkPlace: text(form, "socialWorkPlace"),
      socialWorkStart: text(form, "socialWorkStart"),
      confirmed: text(form, "confirmed") === CONFIRMED,
    },
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(PENALTIES_ADDRESS);
  const { name, status } = saved.value;
  return { error: null, done: savedMessage(name, status) };
}

/**
 * The highest version a change may be sent from: the version is a
 * database integer, and a kept change writes the one after it, which a
 * larger number would make the database refuse with an error.
 */
const HIGHEST_SENT_VERSION = 2 ** 31 - 2;

/**
 * The version of the penalty the screen showed. Anything else, such as
 * no whole number or one the database cannot hold, becomes 0, which no
 * penalty has, so the change is refused as outdated.
 */
function sentVersion(version: unknown): number {
  if (typeof version !== "number" || !Number.isSafeInteger(version)) return 0;
  if (version < 1 || version > HIGHEST_SENT_VERSION) return 0;
  return version;
}

function isOutdated(changed: FollowUpOutcome): boolean {
  return !changed.ok && "current" in changed;
}

/**
 * What a follow-up kept or refused tells what was pressed: the penalty
 * kept, or as it is now when someone changed it first.
 */
function answerOf(changed: FollowUpOutcome, done: string): FollowUpState {
  if (changed.ok) {
    return { error: null, done, followUp: changed.value, unfinishedWork: null };
  }
  return {
    error: changed.error,
    done: null,
    followUp: "current" in changed ? changed.current : null,
    unfinishedWork: null,
  };
}

/** The answer with "Kerja sosial belum selesai" read again, once a status may have changed. */
async function withUnfinishedWork(
  db: Database,
  actor: Account,
  answer: FollowUpState,
): Promise<FollowUpState> {
  if (answer.followUp === null) return answer;
  return { ...answer, unfinishedWork: await readUnfinishedWork(db, actor) };
}

/**
 * The status choice of a row of "Daftar pelanggaran". The page is not
 * drawn again: the row takes the penalty given back, and the numbers
 * take "Kerja sosial belum selesai" read again.
 */
export async function changePenaltyStatusAction(
  id: string,
  version: number,
  status: string,
): Promise<FollowUpState> {
  const actor = await follower();
  const db = database();
  const changed = await changePenaltyStatus(
    db,
    actor,
    String(id),
    sentVersion(version),
    String(status),
  );
  return withUnfinishedWork(db, actor, answerOf(changed, STATUS_UPDATED));
}

/**
 * A tick of Syarat melanjutkan studi in "Rincian", kept at once. Refused
 * because someone changed the penalty first, whose status may have
 * changed too, it reads "Kerja sosial belum selesai" again.
 */
export async function changePenaltyConditionAction(
  id: string,
  version: number,
  condition: string,
  met: boolean,
): Promise<FollowUpState> {
  const actor = await follower();
  const db = database();
  const changed = await changePenaltyCondition(
    db,
    actor,
    String(id),
    sentVersion(version),
    String(condition),
    met === true,
  );
  const answer = answerOf(changed, CONDITION_SAVED);
  if (!isOutdated(changed)) return answer;
  return withUnfinishedWork(db, actor, answer);
}

/** Keputusan in "Rincian", read again as a tick is. */
export async function changePenaltyDecisionAction(
  id: string,
  version: number,
  decision: string,
): Promise<FollowUpState> {
  const actor = await follower();
  const db = database();
  const changed = await changePenaltyDecision(
    db,
    actor,
    String(id),
    sentVersion(version),
    String(decision),
  );
  const answer = answerOf(changed, DECISION_RECORDED);
  if (!isOutdated(changed)) return answer;
  return withUnfinishedWork(db, actor, answer);
}
