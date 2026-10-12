"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { restartCompanion, stopCompanion } from "./companion-duty";
import { COMPANIONS_ADDRESS } from "./companions-address";
import { nameCompanion } from "./name-companion";
import { ROOMS_ADDRESS } from "./rooms-address";

async function companionManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_dorm_companions")) forbidden();
  return account;
}

/**
 * What a form is told after a change: the refusal, or what was done.
 * Ploting kamar shows the kakak pendamping too, so it is read anew as well.
 */
function answer(changed: Parsed<string>): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(COMPANIONS_ADDRESS);
  revalidatePath(ROOMS_ADDRESS);
  return { error: null, done: changed.value };
}

export async function nameCompanionAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await companionManager();
  const named = await nameCompanion(database(), manager, {
    studentId: text(form, "studentId"),
    dorm: text(form, "dorm"),
    note: text(form, "note"),
  });
  return answer(named);
}

export async function stopCompanionAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await companionManager();
  const stopped = await stopCompanion(database(), manager, {
    studentId: text(form, "studentId"),
    roomId: text(form, "roomId"),
  });
  return answer(stopped);
}

export async function restartCompanionAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await companionManager();
  const studentId = text(form, "studentId");
  return answer(await restartCompanion(database(), manager, studentId));
}
