"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ACTIVITIES_ADDRESS } from "./activities-address";
import type { SentActivity } from "./activity-input";
import { isOutdatedList } from "./activity-messages";
import { savedWords } from "./activity-words";
import { addActivity } from "./add-activity";
import { changeActivity } from "./change-activity";
import { markDayOff } from "./mark-day-off";
import { removeActivity, restoreActivity } from "./remove-activity";

async function activityManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_dorm_activities")) forbidden();
  return account;
}

function sentActivity(form: FormData): SentActivity {
  return {
    name: text(form, "name"),
    category: text(form, "category"),
    location: text(form, "location"),
    pattern: text(form, "pattern"),
    weekdays: texts(form, "weekdays"),
    monthDay: text(form, "monthDay"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
    day: text(form, "day"),
    startTime: text(form, "startTime"),
    endTime: text(form, "endTime"),
    organiser: text(form, "organiser"),
    organiserName: text(form, "organiserName"),
    audience: text(form, "audience"),
    isRequired: text(form, "required") === "on",
    daysOff: texts(form, "daysOff"),
    rundownTimes: texts(form, "rundownTime"),
    rundownActivities: texts(form, "rundownActivity"),
  };
}

/**
 * What a refused change answers. When someone else changed or removed the
 * activity first, the lists behind the form are read again, so they show
 * what is there now.
 */
function refusal(error: string): FormState {
  if (isOutdatedList(error)) revalidatePath(ACTIVITIES_ADDRESS);
  return { error, done: null };
}

export async function saveActivityAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await activityManager();
  const sent = sentActivity(form);
  // A form with a version changes the activity it was opened for; one
  // without adds a new one under the key it made.
  const id = text(form, "id");
  const version = text(form, "version");
  const saved =
    version === ""
      ? await addActivity(database(), manager, id, sent)
      : await changeActivity(database(), manager, id, version, sent);
  if (!saved.ok) return refusal(saved.error);
  revalidatePath(ACTIVITIES_ADDRESS);
  return { error: null, done: savedWords(saved.value) };
}

export async function markDayOffAction(
  id: string,
  day: string,
): Promise<FormState> {
  const manager = await activityManager();
  const marked = await markDayOff(database(), manager, id, day);
  if (!marked.ok) return refusal(marked.error);
  revalidatePath(ACTIVITIES_ADDRESS);
  return { error: null, done: marked.value };
}

export async function removeActivityAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const removed = await removeActivity(database(), manager, id);
  if (!removed.ok) return refusal(removed.error);
  revalidatePath(ACTIVITIES_ADDRESS);
  return { error: null, done: "Kegiatan dihapus." };
}

export async function restoreActivityAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const restored = await restoreActivity(database(), manager, id);
  if (!restored.ok) return refusal(restored.error);
  revalidatePath(ACTIVITIES_ADDRESS);
  return { error: null, done: "Kegiatan dikembalikan ke jadwal." };
}
