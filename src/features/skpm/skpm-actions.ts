"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { saveConversion, savedConversionMessage } from "./save-conversion";
import { SKPM_ADDRESS } from "./skpm-address";

/**
 * The signed-in account when it has the right "Unggah data SKPM". Any
 * other is refused before anything of what it sent is read.
 */
async function uploader(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "upload_skpm")) forbidden();
  return account;
}

/** "Simpan konversi". Who set it is the signed-in account, never a field. */
export async function saveConversionAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await uploader();
  const saved = await saveConversion(database(), actor, text(form, "points"));
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(SKPM_ADDRESS);
  return { error: null, done: savedConversionMessage(saved.value) };
}
