"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { INDICATORS_VERSION_FIELD, sentIndicatorsOf } from "./indicator-input";
import { INDICATORS_SAVED_MESSAGE, saveIndicators } from "./save-indicators";
import { SCORES_ADDRESS } from "./scores-address";

/**
 * The signed-in account when it may set the indicators of the mentoring
 * score. Any other is refused before anything of what it sent is read.
 */
async function indicatorSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_mentoring_indicators")) forbidden();
  return account;
}

/** "Simpan indikator". Who set them is the signed-in account, never a field. */
export async function saveIndicatorsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await indicatorSetter();
  const saved = await saveIndicators(
    database(),
    actor,
    sentIndicatorsOf(form),
    text(form, INDICATORS_VERSION_FIELD),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(SCORES_ADDRESS);
  return { error: null, done: INDICATORS_SAVED_MESSAGE };
}
