"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
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
import type { FollowUpState, PenaltyFollowUp } from "./penalty-follow-up";
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

/** What a follow-up kept or refused tells what was pressed. */
function answerOf(
  changed: Parsed<PenaltyFollowUp>,
  done: string,
): FollowUpState {
  if (!changed.ok) {
    return {
      error: changed.error,
      done: null,
      followUp: null,
      unfinishedWork: null,
    };
  }
  return { error: null, done, followUp: changed.value, unfinishedWork: null };
}

/**
 * The status choice of a row of "Daftar pelanggaran". The page is not
 * drawn again: the row takes the penalty given back, and the numbers
 * take "Kerja sosial belum selesai" read again.
 */
export async function changePenaltyStatusAction(
  id: string,
  status: string,
): Promise<FollowUpState> {
  const actor = await follower();
  const db = database();
  const changed = await changePenaltyStatus(
    db,
    actor,
    String(id),
    String(status),
  );
  const answer = answerOf(changed, STATUS_UPDATED);
  if (!changed.ok) return answer;
  return { ...answer, unfinishedWork: await readUnfinishedWork(db, actor) };
}

/** A tick of Syarat melanjutkan studi in "Rincian", kept at once. */
export async function changePenaltyConditionAction(
  id: string,
  condition: string,
  met: boolean,
): Promise<FollowUpState> {
  const actor = await follower();
  const changed = await changePenaltyCondition(
    database(),
    actor,
    String(id),
    String(condition),
    met === true,
  );
  return answerOf(changed, CONDITION_SAVED);
}

/** Keputusan in "Rincian". */
export async function changePenaltyDecisionAction(
  id: string,
  decision: string,
): Promise<FollowUpState> {
  const actor = await follower();
  const changed = await changePenaltyDecision(
    database(),
    actor,
    String(id),
    String(decision),
  );
  return answerOf(changed, DECISION_RECORDED);
}
