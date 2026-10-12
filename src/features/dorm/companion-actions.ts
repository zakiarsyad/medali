"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { COMPANIONS_ADDRESS } from "./companions-address";
import { nameCompanion } from "./name-companion";

async function companionManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_dorm_companions")) forbidden();
  return account;
}

/** What a form is told after a change: the refusal, or what was done. */
function answer(changed: Parsed<string>): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(COMPANIONS_ADDRESS);
  return { error: null, done: changed.value };
}

export async function nameCompanionAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await companionManager();
  const named = await nameCompanion(database(), manager, {
    studentId: text(form, "studentId"),
    dorm: text(form, "dorm"),
    note: text(form, "note"),
  });
  return answer(named);
}
