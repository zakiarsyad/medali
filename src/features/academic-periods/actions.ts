"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addPeriod } from "./add-period";
import { changePeriodDates } from "./change-period-dates";
import { UNDERSTOOD, UNDERSTOOD_FIELD } from "./close-request";
import { closeSemester } from "./close-semester";
import { closedAddress, PERIODS_ADDRESS } from "./period-address";

async function periodSetter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "set_academic_periods")) forbidden();
  return account;
}

export async function addPeriodAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const setter = await periodSetter();
  const added = await addPeriod(database(), setter, {
    year: text(form, "year"),
    term: text(form, "term"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
  });
  if (!added.ok) return { error: added.error, done: null };
  revalidatePath(PERIODS_ADDRESS);
  return { error: null, done: `Periode ${added.value} ditambahkan.` };
}

async function semesterCloser(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "close_semesters")) forbidden();
  return account;
}

export async function closeSemesterAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const closer = await semesterCloser();
  const id = text(form, "id");
  const understood = text(form, UNDERSTOOD_FIELD) === UNDERSTOOD;
  const closed = await closeSemester(database(), closer, id, understood);
  if (!closed.ok) return { error: closed.error, done: null };
  revalidatePath(PERIODS_ADDRESS);
  redirect(closedAddress(id));
}

export async function changePeriodDatesAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const setter = await periodSetter();
  const changed = await changePeriodDates(
    database(),
    setter,
    text(form, "id"),
    { startsOn: text(form, "startsOn"), endsOn: text(form, "endsOn") },
  );
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(PERIODS_ADDRESS);
  return { error: null, done: `Tanggal periode ${changed.value} diubah.` };
}
