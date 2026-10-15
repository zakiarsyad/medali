"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { FITNESS_ADDRESS } from "./fitness-address";
import { LIMITS_VERSION_FIELD } from "./fitness-input";
import { LIMITS_SAVED_MESSAGE, saveFitnessLimits } from "./save-fitness-limits";

/**
 * The signed-in account when it has the right "Bobot penilaian". Any
 * other is refused before anything of what it sent is read.
 */
async function limitsSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_grade_weights")) forbidden();
  return account;
}

/** "Simpan ambang". Who set the limits is the signed-in account, never a field. */
export async function saveLimitsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await limitsSetter();
  const saved = await saveFitnessLimits(
    database(),
    actor,
    {
      excellentFrom: text(form, "excellentFrom"),
      goodFrom: text(form, "goodFrom"),
      attentionFrom: text(form, "attentionFrom"),
    },
    text(form, LIMITS_VERSION_FIELD),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(FITNESS_ADDRESS);
  return { error: null, done: LIMITS_SAVED_MESSAGE };
}
