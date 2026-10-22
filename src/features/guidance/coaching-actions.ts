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
 * The highest version a change may be sent from: the version is a
 * database integer, and a kept change writes the one after it, which a
 * larger number would make the database refuse with an error.
 */
const HIGHEST_SENT_VERSION = 2 ** 31 - 2;

/**
 * The version of the status the screen showed, 0 for none saved.
 * Anything else, such as no whole number or one the database cannot
 * hold, becomes -1, which no status has, so the change is refused as
 * outdated.
 */
function sentVersion(version: unknown): number {
  if (typeof version !== "number" || !Number.isSafeInteger(version)) return -1;
  if (version < 0 || version > HIGHEST_SENT_VERSION) return -1;
  return version;
}

/**
 * The status choice of a row of Pembinaan karakter, with its optional
 * "Catatan", sent from the version of the status the screen showed. Who
 * changed it is the signed-in account, never a field. The tab is read
 * again once a change is kept, or refused because someone changed the
 * status first, so the row shows the status as it is now, and the
 * numbers and the menu follow it.
 */
export async function changeCoachingStatusAction(
  studentId: string,
  version: number,
  status: string,
  note: string,
): Promise<FormState> {
  const actor = await changer();
  const changed = await changeCoachingStatus(
    database(),
    actor,
    String(studentId),
    sentVersion(version),
    String(status),
    String(note),
  );
  const isOutdated = "current" in changed;
  if (changed.ok || isOutdated) revalidatePath(COACHING_ADDRESS);
  if (!changed.ok) return { error: changed.error, done: null };
  const { name, status: kept } = changed.value;
  return { error: null, done: statusChangedMessage(name, kept) };
}
