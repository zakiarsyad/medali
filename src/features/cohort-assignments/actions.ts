"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ASSIGNMENT_ADDRESS } from "./assignment-address";
import { STEP_ACTIONS } from "./assignment-steps";
import { formAssignment } from "./form-assignment";
import { parseForming } from "./forming-input";

async function preparer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, STEP_ACTIONS.form)) forbidden();
  return account;
}

/** "Bentuk kelompok" and "Bentuk ulang". */
export async function formGroupsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseForming({
    cohortYear: text(form, "cohortYear"),
    targetSize: text(form, "targetSize"),
    method: text(form, "method"),
    version: text(form, "version"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const formed = await formAssignment(database(), actor, parsed.value);
  // Also after a refusal: one made from an older draft is shown the latest.
  revalidatePath(ASSIGNMENT_ADDRESS);
  if (!formed.ok) return { error: formed.error, done: null };
  const { cohortYear } = parsed.value;
  return {
    error: null,
    done: `${formed.value} kelompok dibentuk untuk angkatan ${cohortYear}.`,
  };
}
