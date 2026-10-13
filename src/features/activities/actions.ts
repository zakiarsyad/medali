"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addSchedule } from "./add-schedule";
import { savedWords } from "./form-words";
import type { SentSchedule } from "./schedule-input";
import { SCHEDULES_ADDRESS } from "./schedule-list-address";

async function activityManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_activities")) forbidden();
  return account;
}

function sentSchedule(form: FormData): SentSchedule {
  return {
    activityId: text(form, "activity"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
    startTime: text(form, "startTime"),
    endTime: text(form, "endTime"),
    uploadCount: text(form, "uploadCount"),
    uploadUnit: text(form, "uploadUnit"),
    location: text(form, "location"),
    isRequired: text(form, "required") === "on",
  };
}

export async function saveScheduleAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await activityManager();
  const saved = await addSchedule(
    database(),
    manager,
    text(form, "id"),
    sentSchedule(form),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(SCHEDULES_ADDRESS);
  const { name, semester } = saved.value;
  return { error: null, done: savedWords(name, semester) };
}
