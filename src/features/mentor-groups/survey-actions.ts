"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import {
  cancelSurveyPeriod,
  changeSurveyEnd,
  closeSurveyPeriod,
} from "./change-survey-period";
import { fixSurveyResults } from "./fix-survey-results";
import { openSurveyPeriod } from "./open-survey-period";
import { SURVEY_ADDRESS } from "./survey-address";
import { parseSurveyEnd, parseSurveyPeriod } from "./survey-input";
import { fixedResultsWords } from "./survey-result-words";
import {
  CANCELLED_SURVEY_WORDS,
  CLOSED_WORDS,
  endChangedWords,
  openedSurveyWords,
} from "./survey-words";

/**
 * The signed-in account when it may manage the survey periods. Any other
 * is refused before anything of what it sent is read.
 */
async function surveyManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_survey_periods")) forbidden();
  return account;
}

/** "Buka periode evaluasi". */
export async function openSurveyPeriodAction(
  form: FormData,
): Promise<FormState> {
  const actor = await surveyManager();
  const today = campusDay();
  const parsed = parseSurveyPeriod(
    {
      periodId: text(form, "periodId"),
      startsOn: text(form, "startsOn"),
      endsOn: text(form, "endsOn"),
      achievementWeight: text(form, "achievementWeight"),
      note: text(form, "note"),
    },
    today,
  );
  if (!parsed.ok) return { error: parsed.error, done: null };

  const opened = await openSurveyPeriod(database(), actor, parsed.value, today);
  if (!opened.ok) return { error: opened.error, done: null };
  revalidatePath(SURVEY_ADDRESS);
  return { error: null, done: openedSurveyWords(opened.value, today) };
}

/** "Simpan tanggal" under "Ubah tanggal ditutup". */
export async function changeSurveyEndAction(
  form: FormData,
): Promise<FormState> {
  const actor = await surveyManager();
  const endsOn = parseSurveyEnd(text(form, "endsOn"));
  if (!endsOn.ok) return { error: endsOn.error, done: null };

  const id = text(form, "surveyPeriodId");
  const changed = await changeSurveyEnd(database(), actor, id, endsOn.value);
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(SURVEY_ADDRESS);
  return { error: null, done: endChangedWords(changed.value.endsOn) };
}

/** "Tutup periode sekarang". */
export async function closeSurveyPeriodAction(
  form: FormData,
): Promise<FormState> {
  const actor = await surveyManager();
  const id = text(form, "surveyPeriodId");
  const closed = await closeSurveyPeriod(database(), actor, id);
  if (!closed.ok) return { error: closed.error, done: null };
  revalidatePath(SURVEY_ADDRESS);
  return { error: null, done: CLOSED_WORDS };
}

/**
 * The signed-in account when it may fix the survey results. Any other is
 * refused before anything of what it sent is read.
 */
async function resultsFixer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "fix_survey_results")) forbidden();
  return account;
}

/** "Tetapkan hasil evaluasi". */
export async function fixSurveyResultsAction(
  form: FormData,
): Promise<FormState> {
  const actor = await resultsFixer();
  const id = text(form, "surveyPeriodId");
  const fixed = await fixSurveyResults(database(), actor, id);
  if (!fixed.ok) return { error: fixed.error, done: null };
  revalidatePath(SURVEY_ADDRESS);
  return { error: null, done: fixedResultsWords(fixed.value.lines) };
}

/** "Batalkan periode". */
export async function cancelSurveyPeriodAction(
  form: FormData,
): Promise<FormState> {
  const actor = await surveyManager();
  const id = text(form, "surveyPeriodId");
  const cancelled = await cancelSurveyPeriod(database(), actor, id);
  if (!cancelled.ok) return { error: cancelled.error, done: null };
  revalidatePath(SURVEY_ADDRESS);
  return { error: null, done: CANCELLED_SURVEY_WORDS };
}
