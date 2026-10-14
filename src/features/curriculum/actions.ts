"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addPpksActivity } from "./add-ppks-activity";
import { changePpksActivity, removePpksActivity } from "./change-ppks-activity";
import { restorePpksActivity } from "./restore-ppks-activity";
import { saveBaseScore } from "./save-base-score";
import { saveMainIndicators } from "./save-main-indicators";
import { saveStageBreakdown } from "./save-stage-breakdown";
import { readScheduleCount } from "./schedule-counts";

const CURRICULUM_ADDRESS = "/kurikulum";

async function curriculumChanger(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "change_curriculum")) forbidden();
  return account;
}

export async function saveMainIndicatorsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const changer = await curriculumChanger();
  const saved = await saveMainIndicators(database(), changer, (code) =>
    text(form, code),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: "Indikator utama disimpan." };
}

export async function saveBaseScoreAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const changer = await curriculumChanger();
  const saved = await saveBaseScore(database(), changer, text(form, "score"));
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: `Nilai dasar SIKU menjadi ${saved.value}.` };
}

export async function saveStageBreakdownAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const changer = await curriculumChanger();
  const saved = await saveStageBreakdown(database(), changer, {
    tahap: text(form, "tahap"),
    valueKey: text(form, "value"),
    text: text(form, "text"),
    activities: texts(form, "activity"),
    indicatorCodes: texts(form, "indicator"),
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: `Penjabaran ${saved.value} disimpan.` };
}

async function activityManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_activities")) forbidden();
  return account;
}

export async function savePpksActivityAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await activityManager();
  const sent = {
    semester: text(form, "semester"),
    name: text(form, "name"),
    valueKeys: texts(form, "value"),
    indicatorCodes: texts(form, "indicator"),
    target: text(form, "target"),
    isRequired: text(form, "required") === "on",
    description: text(form, "description"),
  };
  // A form with a version changes the activity it was opened for; one
  // without adds a new one under the key it made.
  const id = text(form, "id");
  const version = text(form, "version");
  const saved =
    version === ""
      ? await addPpksActivity(database(), manager, id, sent)
      : await changePpksActivity(database(), manager, id, version, sent);
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: `Kegiatan "${saved.value}" disimpan.` };
}

export async function scheduleCountAction(id: string): Promise<Parsed<number>> {
  const manager = await activityManager();
  return readScheduleCount(database(), manager, id);
}

export async function removePpksActivityAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const removed = await removePpksActivity(database(), manager, id);
  if (!removed.ok) return { error: removed.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: "Kegiatan dihapus dari daftar." };
}

export async function restorePpksActivityAction(
  id: string,
): Promise<FormState> {
  const manager = await activityManager();
  const restored = await restorePpksActivity(database(), manager, id);
  if (!restored.ok) return { error: restored.error, done: null };
  revalidatePath(CURRICULUM_ADDRESS);
  return { error: null, done: "Kegiatan dikembalikan ke daftar." };
}
