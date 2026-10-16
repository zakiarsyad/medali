"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { type ConsentOutcome, changeOwnConsent } from "./change-consent";
import type { StudentMove } from "./consent-rules";

const COUNSELLING_ADDRESS = "/konseling";

/**
 * The signed-in account when it has the right to answer its own
 * counselling consent. Any other is refused before anything of what it
 * sent is read, and gets nothing back.
 */
async function consentingStudent(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "answer_own_counselling_consent"))
    forbidden();
  return account;
}

/**
 * The student's page is drawn again after every press that reached the
 * consent, so it shows the status as it is now, also after a refusal.
 */
async function pressed(
  actor: Account,
  move: StudentMove,
  version: string,
): Promise<ConsentOutcome> {
  const outcome = await changeOwnConsent(database(), actor, move, version);
  if (outcome.kind !== "refused") revalidatePath(COUNSELLING_ADDRESS);
  return outcome;
}

/** "Setujui". `version` is the consent the page showed. */
export async function approveConsentAction(
  version: string,
): Promise<ConsentOutcome> {
  const actor = await consentingStudent();
  return pressed(actor, "approve", version);
}

/** "Tolak". */
export async function declineConsentAction(
  version: string,
): Promise<ConsentOutcome> {
  const actor = await consentingStudent();
  return pressed(actor, "decline", version);
}

/** "Cabut persetujuan", once confirmed. */
export async function withdrawConsentAction(
  version: string,
): Promise<ConsentOutcome> {
  const actor = await consentingStudent();
  return pressed(actor, "withdraw", version);
}
