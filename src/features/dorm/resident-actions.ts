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
import { addResident } from "./add-resident";
import { CLEANING_ADDRESS } from "./cleaning-address";
import { makeNonResident } from "./make-non-resident";
import { ROOMS_ADDRESS } from "./rooms-address";

async function residentSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_dorm_residents")) forbidden();
  return account;
}

/**
 * What a form is told after a change: the refusal, or what was done.
 * Pembersihan asrama shows the rooms with their residents, so it is read
 * anew too.
 */
function answer(changed: Parsed<string>): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(ROOMS_ADDRESS);
  revalidatePath(CLEANING_ADDRESS);
  return { error: null, done: changed.value };
}

export async function addResidentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const setter = await residentSetter();
  const added = await addResident(database(), setter, {
    studentId: text(form, "studentId"),
    dorm: text(form, "dorm"),
    note: text(form, "note"),
  });
  return answer(added);
}

export async function makeNonResidentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const setter = await residentSetter();
  const studentId = text(form, "studentId");
  return answer(await makeNonResident(database(), setter, studentId));
}
