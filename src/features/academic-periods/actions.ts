"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addPeriod } from "./add-period";
import { changePeriodDates } from "./change-period-dates";

const PERIODS_ADDRESS = "/pengaturan/periode";

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
