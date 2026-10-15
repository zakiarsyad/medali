"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { CLEANING_ADDRESS } from "./cleaning-address";
import { judgeDuty } from "./judge-cleaning";
import {
  type DecisionAnswer,
  keptDecision,
  refusedDecision,
} from "./leave-messages";
import { sendBackDuty, validateDuty } from "./validate-cleaning";

/** What the browser sent, which is not trusted to be a text. */
function asText(sent: unknown): string {
  return typeof sent === "string" ? sent : "";
}

/** The signed-in account when it may judge cleaning: BAM - BPHK and BAM - Kerumahtanggaan. */
async function cleaningJudge(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "judge_dorm_cleaning")) forbidden();
  return account;
}

function answer(changed: Parsed<string>): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(CLEANING_ADDRESS);
  return { error: null, done: changed.value };
}

/** The signed-in account when it may validate cleaning: Pengelola Asrama. */
async function cleaningValidator(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "validate_dorm_cleaning")) forbidden();
  return account;
}

/**
 * A decision of Pengelola Asrama as the screen is answered. Pembersihan
 * asrama, Tugas saya, and the number beside Tugas saya in the menu of
 * every page change with a kept one.
 */
function decisionAnswer(decided: Parsed<string>): DecisionAnswer {
  if (!decided.ok) return refusedDecision(decided);
  revalidatePath("/", "layout");
  return keptDecision(decided.value);
}

/** "Validasi" of Pengelola Asrama on a duty BAM judged, on Pembersihan asrama and on Tugas saya. */
export async function validateDutyAction(
  dutyId: string,
): Promise<DecisionAnswer> {
  const validator = await cleaningValidator();
  const validated = await validateDuty(database(), validator, asText(dutyId));
  return decisionAnswer(validated);
}

/** "Tolak penilaian" of Pengelola Asrama, with its reason, on Pembersihan asrama and on Tugas saya. */
export async function sendBackDutyAction(
  dutyId: string,
  reason: string,
): Promise<DecisionAnswer> {
  const validator = await cleaningValidator();
  const sent = await sendBackDuty(
    database(),
    validator,
    asText(dutyId),
    reason,
  );
  return decisionAnswer(sent);
}

/** "Memenuhi" or "Tidak memenuhi" of BAM on a duty, with its Catatan. */
export async function judgeDutyAction(
  dutyId: string,
  result: string,
  note: string,
): Promise<FormState> {
  const judge = await cleaningJudge();
  const judged = await judgeDuty(database(), judge, {
    dutyId: asText(dutyId),
    result,
    note,
  });
  return answer(judged);
}
