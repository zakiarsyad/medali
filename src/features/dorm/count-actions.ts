"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import { ACTIVITIES_ADDRESS } from "./activities-address";
import type { CountFormState } from "./count-form-state";
import { parseCount } from "./count-input";
import { COUNT_CHANGED } from "./count-messages";
import { saveCount } from "./save-count";

/**
 * The signed-in account when it may count the attendance. Any other is
 * refused before anything of what it sent is read.
 */
async function counter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "count_dorm_attendance")) forbidden();
  return account;
}

function doneWords(isAnnouncement: boolean, wasAnnounced: boolean): string {
  if (!isAnnouncement) return "Draf penghitungan disimpan.";
  if (wasAnnounced) return "Ketidakhadiran diumumkan ulang.";
  return "Ketidakhadiran diumumkan.";
}

/**
 * "Simpan", "Umumkan ketidakhadiran" and "Umumkan ulang". Who counted is
 * the signed-in account, never a field. A save refused because someone
 * else saved first reads the tab anew, so a reload shows their count. A
 * save that left out a change of the account's own mark says so.
 */
export async function saveCountAction(
  before: CountFormState,
  form: FormData,
): Promise<CountFormState> {
  const actor = await counter();
  const parsed = parseCount({
    activityId: text(form, "activityId"),
    day: text(form, "day"),
    version: text(form, "version"),
    intent: text(form, "intent"),
    absentIds: texts(form, "absent"),
    noteIds: texts(form, "noteStudent"),
    noteTexts: texts(form, "noteText"),
  });
  if (!parsed.ok) return { ...before, error: parsed.error, done: null };

  const saved = await saveCount(database(), actor, parsed.value);
  if (!saved.ok) {
    if (saved.error === COUNT_CHANGED.error) revalidatePath(ACTIVITIES_ADDRESS);
    return { ...before, error: saved.error, done: null };
  }
  revalidatePath(ACTIVITIES_ADDRESS);
  const { version, isAnnounced, ownMarkRefusal } = saved.value;
  // The other rows were saved, so the form takes the new version too.
  if (ownMarkRefusal !== null) {
    return { error: ownMarkRefusal, done: null, version, isAnnounced };
  }
  return {
    error: null,
    done: doneWords(parsed.value.isAnnouncement, before.isAnnounced),
    version,
    isAnnounced,
  };
}
