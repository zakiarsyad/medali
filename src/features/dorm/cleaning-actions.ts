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
import { CLEANING_ADDRESS } from "./cleaning-address";
import {
  PLACE_RENAMED,
  placeAdded,
  placeRemoved,
  placeRestored,
} from "./cleaning-messages";
import {
  addCleaningPlace,
  removeCleaningPlace,
  renameCleaningPlace,
  restoreCleaningPlace,
} from "./cleaning-places";

async function cleaningManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_dorm_cleaning")) forbidden();
  return account;
}

/** What a form or a button is told after a change: the refusal, or what was done. */
function answer(
  changed: Parsed<string>,
  done: (value: string) => string,
): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(CLEANING_ADDRESS);
  return { error: null, done: done(changed.value) };
}

export async function addCleaningPlaceAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await cleaningManager();
  const added = await addCleaningPlace(database(), manager, {
    name: text(form, "name"),
    dorm: text(form, "dorm"),
  });
  return answer(added, placeAdded);
}

export async function renameCleaningPlaceAction(
  placeId: string,
  name: string,
): Promise<FormState> {
  const manager = await cleaningManager();
  const renamed = await renameCleaningPlace(database(), manager, {
    placeId,
    // What the browser sends is not trusted to be a text.
    name: typeof name === "string" ? name : "",
  });
  return answer(renamed, () => PLACE_RENAMED);
}

export async function removeCleaningPlaceAction(
  placeId: string,
): Promise<FormState> {
  const manager = await cleaningManager();
  const removed = await removeCleaningPlace(database(), manager, placeId);
  return answer(removed, placeRemoved);
}

export async function restoreCleaningPlaceAction(
  placeId: string,
): Promise<FormState> {
  const manager = await cleaningManager();
  const restored = await restoreCleaningPlace(database(), manager, placeId);
  return answer(restored, placeRestored);
}
