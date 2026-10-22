"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { sentCsvFile } from "@/files/sent-csv-file";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { removeSkpmUpload } from "./remove-skpm-upload";
import { saveConversion, savedConversionMessage } from "./save-conversion";
import { savedMessage, saveSkpmFile } from "./save-skpm-file";
import { SKPM_ADDRESS } from "./skpm-address";
import { previewSkpmFile } from "./skpm-file-check";
import type { SkpmFilePreview } from "./skpm-file-preview";

/**
 * The signed-in account when it has the right "Unggah data SKPM". Any
 * other is refused before anything of what it sent is read.
 */
async function uploader(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "upload_skpm")) forbidden();
  return account;
}

/** "Unggah data SKPM": what a picked file would do. Saves nothing. */
export async function previewSkpmFileAction(
  form: FormData,
): Promise<Parsed<SkpmFilePreview>> {
  const actor = await uploader();
  const file = await sentCsvFile(form);
  if (!file.ok) return file;
  return previewSkpmFile(database(), actor, file.value);
}

/**
 * "Simpan (n) baris": the file is read and checked again by the server.
 * `id` is the key the screen made for the file; `mode` is "Tambahkan" or
 * "Ganti semua data"; `confirmRepeat` is the confirm that a file saved
 * before is to be saved again.
 */
export async function saveSkpmFileAction(
  form: FormData,
): Promise<Parsed<string>> {
  const actor = await uploader();
  const file = await sentCsvFile(form);
  if (!file.ok) return file;
  const confirmed = text(form, "confirmRepeat") === "yes";
  const saved = await saveSkpmFile(
    database(),
    actor,
    text(form, "id"),
    text(form, "mode"),
    file.value,
    confirmed,
  );
  if (!saved.ok) return saved;
  revalidatePath(SKPM_ADDRESS);
  return { ok: true, value: savedMessage(saved.value) };
}

/** "Hapus" on an upload. Who removed it is the signed-in account. */
export async function removeSkpmUploadAction(id: string): Promise<FormState> {
  const actor = await uploader();
  const removed = await removeSkpmUpload(database(), actor, String(id));
  if (!removed.ok) return { error: removed.error, done: null };
  revalidatePath(SKPM_ADDRESS);
  return { error: null, done: "Unggahan dihapus." };
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
