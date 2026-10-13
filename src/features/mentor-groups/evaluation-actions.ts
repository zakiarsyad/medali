"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { EVALUATION_ADDRESS } from "./evaluation-address";
import { parseEvaluation } from "./evaluation-input";
import { savedWords } from "./evaluation-words";
import { saveEvaluation } from "./save-evaluation";

/**
 * The signed-in account when it may evaluate a mentor. Any other is
 * refused before anything of what it sent is read.
 */
async function evaluator(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "evaluate_mentors")) forbidden();
  return account;
}

/** "Simpan evaluasi". */
export async function saveEvaluationAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await evaluator();
  const parsed = parseEvaluation({
    groupId: text(form, "groupId"),
    periodId: text(form, "periodId"),
    activity: text(form, "activity"),
    attendance: text(form, "attendance"),
    achievement: text(form, "achievement"),
    feedback: text(form, "feedback"),
    note: text(form, "note"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const saved = await saveEvaluation(database(), actor, parsed.value);
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(EVALUATION_ADDRESS);
  return { error: null, done: savedWords(saved.value) };
}
