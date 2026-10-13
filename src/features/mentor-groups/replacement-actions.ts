"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { EVALUATION_ADDRESS } from "./evaluation-address";
import { parseReplacement } from "./replacement-input";
import { savedReplacementWords } from "./replacement-words";
import { saveReplacement } from "./save-replacement";

/**
 * The signed-in account when it may set and cancel a replacement. Any
 * other is refused before anything of what it sent is read.
 */
async function replacer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "replace_mentors")) forbidden();
  return account;
}

/** "Tetapkan penggantian". */
export async function saveReplacementAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await replacer();
  const parsed = parseReplacement({
    groupId: text(form, "groupId"),
    reason: text(form, "reason"),
    startsOn: text(form, "startsOn"),
    newMentorId: text(form, "newMentorId"),
    letterNumber: text(form, "letterNumber"),
    oldMentorStatus: text(form, "oldMentorStatus"),
    note: text(form, "note"),
    confirmed: text(form, "confirmed"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const saved = await saveReplacement(database(), actor, parsed.value);
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(EVALUATION_ADDRESS);
  return { error: null, done: savedReplacementWords(saved.value) };
}
