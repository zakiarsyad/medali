"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { handleDisciplineProposal, type SentHandling } from "./handle-proposal";
import { VIOLATIONS_ADDRESS } from "./violation-address";

/**
 * The signed-in account when it may handle discipline proposals: Kepala
 * Unit. Any other is refused before anything it sent is read.
 */
async function head(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "handle_dorm_discipline_proposals"))
    forbidden();
  return account;
}

/**
 * "Proses" of a discipline proposal, once confirmed. The tab is read
 * again whatever the answer: a refusal often means the row is out of
 * date, as when another Kepala Unit processed it first.
 */
export async function handleDisciplineProposalAction(
  sent: SentHandling,
): Promise<FormState> {
  const actor = await head();
  const handled = await handleDisciplineProposal(
    database(),
    actor,
    { letterId: sent.letterId, note: sent.note },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  if (!handled.ok) return { error: handled.error, done: null };
  return { error: null, done: handled.value };
}
