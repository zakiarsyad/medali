"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { fileStorage } from "@/files/file-storage";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { decideViolationAppeal } from "./decide-appeal";
import { sendViolationAppeal } from "./send-appeal";
import { VIOLATIONS_ADDRESS } from "./violation-address";

/**
 * The signed-in account when it may appeal its own violations. Any other
 * is refused before anything of what it sent is read.
 */
async function resident(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "appeal_own_dorm_violation")) forbidden();
  return account;
}

/** The signed-in account when it may decide appeals: BAM - BPHK and BAM - KI. */
async function decider(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "decide_dorm_violation_appeals"))
    forbidden();
  return account;
}

/** "Terima" or "Tolak" on a card of "Advokasi masuk", with Catatan BAM. */
export async function decideViolationAppealAction(
  id: string,
  kind: string,
  note: string,
): Promise<FormState> {
  const actor = await decider();
  const decided = await decideViolationAppeal(
    database(),
    actor,
    String(id),
    { kind, note },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  if (!decided.ok) return { error: decided.error, done: null };
  return { error: null, done: decided.value };
}

/**
 * "Kirim advokasi" of a resident on a violation of their own. The tab is
 * read again whatever the answer: a refusal often means the row is out
 * of date, as when the appeal time ended since.
 */
export async function sendViolationAppealAction(
  form: FormData,
): Promise<Parsed<string>> {
  const account = await resident();
  const file = form.get("file");
  const isSent = file instanceof File && file.size > 0;
  const sent = await sendViolationAppeal(
    database(),
    fileStorage(),
    account,
    {
      violationId: text(form, "violationId"),
      reason: text(form, "reason"),
      file: isSent
        ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }
        : null,
    },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  return sent;
}
