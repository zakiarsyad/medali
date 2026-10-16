"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { sentCsvFile } from "@/files/sent-csv-file";
import type { Parsed } from "@/parsed";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { FITNESS_ADDRESS } from "./fitness-address";
import { previewFitnessFile } from "./fitness-file-check";
import type { FitnessFilePreview } from "./fitness-file-preview";
import { type GroupMember, readGroupMembers } from "./fitness-groups";
import { LIMITS_VERSION_FIELD, pairedRows } from "./fitness-input";
import { savedScoresMessage } from "./fitness-words";
import { LIMITS_SAVED_MESSAGE, saveFitnessLimits } from "./save-fitness-limits";
import { NOT_GROUP_MEMBERS, saveFitnessScores } from "./save-fitness-scores";

/**
 * The signed-in account when it has the right "Bobot penilaian". Any
 * other is refused before anything of what it sent is read.
 */
async function limitsSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_grade_weights")) forbidden();
  return account;
}

/**
 * The signed-in account when it has the right "Penilaian jasmani". Any
 * other is refused before anything of what it sent is read.
 */
async function scoreEnterer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "enter_fitness_scores")) forbidden();
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

/**
 * "Simpan skor". Who entered the scores is the signed-in account, never
 * a field, and the year of the test is worked out from its day.
 */
export async function saveScoresAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await scoreEnterer();
  const rows = pairedRows(texts(form, "student"), texts(form, "score"));
  if (rows === null) return { error: NOT_GROUP_MEMBERS.error, done: null };
  const saved = await saveFitnessScores(database(), actor, text(form, "id"), {
    groupId: text(form, "groupId"),
    testedOn: text(form, "testedOn"),
    rows,
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(FITNESS_ADDRESS);
  return { error: null, done: savedScoresMessage(saved.value) };
}

/** "Unggah berkas": what a picked file would do. Saves nothing. */
export async function previewFitnessFileAction(
  form: FormData,
): Promise<Parsed<FitnessFilePreview>> {
  const actor = await scoreEnterer();
  const file = await sentCsvFile(form);
  if (!file.ok) return file;
  return previewFitnessFile(database(), actor, file.value);
}

/** "Kelompok mahasiswa": the Aktif members of the group chosen, with Skor saat ini. */
export async function groupMembersAction(
  groupId: string,
): Promise<GroupMember[]> {
  const actor = await scoreEnterer();
  return readGroupMembers(database(), actor, groupId);
}
