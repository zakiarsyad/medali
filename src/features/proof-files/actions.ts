"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { fileStorage } from "@/files/file-storage";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { removedWords } from "./removal-question";
import { removeOldProofs } from "./remove-old-proofs";
import { saveKeepDays } from "./save-keep-days";

const PROOF_FILES_ADDRESS = "/pengaturan/berkas";

async function proofFileManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_proof_files")) forbidden();
  return account;
}

export async function saveKeepDaysAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await proofFileManager();
  const saved = await saveKeepDays(database(), manager, text(form, "days"));
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(PROOF_FILES_ADDRESS);
  return { error: null, done: `Lama simpan ${saved.value} hari disimpan.` };
}

export async function removeOldProofsAction(
  _before: FormState,
): Promise<FormState> {
  const manager = await proofFileManager();
  const removed = await removeOldProofs(database(), fileStorage(), manager);
  revalidatePath(PROOF_FILES_ADDRESS);
  if (!removed.ok) return { error: removed.error, done: null };
  return { error: null, done: removedWords(removed.value) };
}
