"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { changeCoachingStatus } from "./change-coaching-status";
import { COACHING_ADDRESS } from "./coaching-address";
import { statusChangedMessage } from "./coaching-messages";

/**
 * The signed-in account when it may change a coaching status. Any other
 * is refused before anything of what it sent is read.
 */
async function changer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "change_coaching_status")) forbidden();
  return account;
}

/**
 * The status choice of a row of Pembinaan karakter, with its optional
 * "Catatan". Who changed it is the signed-in account, never a field. The
 * tab is read again, so the row, the numbers and the menu follow it.
 */
export async function changeCoachingStatusAction(
  studentId: string,
  status: string,
  note: string,
): Promise<FormState> {
  const actor = await changer();
  const changed = await changeCoachingStatus(
    database(),
    actor,
    String(studentId),
    String(status),
    String(note),
  );
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(COACHING_ADDRESS);
  const { name, status: kept } = changed.value;
  return { error: null, done: statusChangedMessage(name, kept) };
}
