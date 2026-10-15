"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { SAVED_MESSAGE, saveGradeScheme } from "./save-grade-scheme";
import { sentSchemeOf, VERSION_FIELD } from "./scheme-fields";

const CHARACTER_GRADE_ADDRESS = "/penilaian/karakter";

/**
 * The signed-in account when it has the right "Bobot penilaian". Any
 * other is refused before anything of what it sent is read.
 */
async function schemeSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_grade_weights")) forbidden();
  return account;
}

/** "Simpan skema". Who set it is the signed-in account, never a field. */
export async function saveSchemeAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await schemeSetter();
  const saved = await saveGradeScheme(
    database(),
    actor,
    sentSchemeOf((name) => text(form, name)),
    text(form, VERSION_FIELD),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(CHARACTER_GRADE_ADDRESS);
  return { error: null, done: SAVED_MESSAGE };
}
