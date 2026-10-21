"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { SharingOutcome } from "./change-sharing";
import { changeOwnSharing } from "./press-sharing";
import type { StudentSharingMove } from "./sharing-rules";

const COUNSELLING_ADDRESS = "/konseling";

/**
 * The signed-in account when it has the right to answer a sharing of its
 * own counselling data. Any other is refused before anything of what it
 * sent is read, and gets nothing back.
 */
async function sharingStudent(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "answer_own_counselling_sharing"))
    forbidden();
  return account;
}

/**
 * The student's page is drawn again after every press that reached the
 * sharing, so it shows the sharing as it is now, also after a refusal.
 */
async function pressed(
  actor: Account,
  move: StudentSharingMove,
  sharingId: string,
  version: string,
): Promise<SharingOutcome> {
  const outcome = await changeOwnSharing(
    database(),
    actor,
    move,
    sharingId,
    version,
  );
  if (outcome.kind !== "refused") revalidatePath(COUNSELLING_ADDRESS);
  return outcome;
}

/** "Setujui berbagi data". `version` is the sharing the page showed. */
export async function approveSharingAction(
  sharingId: string,
  version: string,
): Promise<SharingOutcome> {
  const actor = await sharingStudent();
  return pressed(actor, "approve", sharingId, version);
}

/** "Tolak" of a request to share. */
export async function declineSharingAction(
  sharingId: string,
  version: string,
): Promise<SharingOutcome> {
  const actor = await sharingStudent();
  return pressed(actor, "decline", sharingId, version);
}

/** "Cabut persetujuan berbagi", once confirmed. */
export async function withdrawSharingAction(
  sharingId: string,
  version: string,
): Promise<SharingOutcome> {
  const actor = await sharingStudent();
  return pressed(actor, "withdraw", sharingId, version);
}
