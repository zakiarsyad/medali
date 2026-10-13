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
import { changeSchedule, SCHEDULE_CHANGED_BY_OTHER } from "./change-schedule";
import { REMOVED_WORDS, savedWords } from "./form-words";
import { removeSchedule } from "./remove-schedule";
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
  const sent = sentSchedule(form);
  // A form with a version changes the schedule it was opened for; one
  // without adds a new one under the key it made.
  const id = text(form, "id");
  const version = text(form, "version");
  const saved =
    version === ""
      ? await addSchedule(database(), manager, id, sent)
      : await changeSchedule(database(), manager, id, version, sent);
  // Also when someone else changed the schedule first: the list behind
  // the form is read again, so it shows their version.
  const isStale = !saved.ok && saved.error === SCHEDULE_CHANGED_BY_OTHER.error;
  if (saved.ok || isStale) revalidatePath(SCHEDULES_ADDRESS);
  if (!saved.ok) return { error: saved.error, done: null };
  const { name, semester } = saved.value;
  return { error: null, done: savedWords(name, semester) };
}

export async function removeScheduleAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const removed = await removeSchedule(database(), manager, id);
  if (!removed.ok) return { error: removed.error, done: null };
  revalidatePath(SCHEDULES_ADDRESS);
  return { error: null, done: REMOVED_WORDS };
}
