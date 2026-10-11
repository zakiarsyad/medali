"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { saveBaseScore } from "./save-base-score";
import { saveMainIndicators } from "./save-main-indicators";

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
