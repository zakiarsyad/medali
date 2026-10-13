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
import { openSurveyPeriod } from "./open-survey-period";
import { SURVEY_ADDRESS } from "./survey-address";
import { parseSurveyPeriod } from "./survey-input";
import { openedSurveyWords } from "./survey-words";

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
