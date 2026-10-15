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
