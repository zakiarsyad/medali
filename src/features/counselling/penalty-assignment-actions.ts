"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { assignFromPenalty } from "./penalty-assignments";

/**
 * The signed-in account when it may send a student to mandatory
 * counselling from a penalty. Any other is refused before anything of
 * what it sent is read.
 */
async function assigner(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "assign_counselling_from_penalty"))
    forbidden();
  return account;
}

/**
 * "Tugaskan konseling" in "Rincian" of a penalty. Only the penalty and
 * the message are taken: the student is the penalty's own.
 */
export async function assignFromPenaltyAction(
  penaltyId: string,
  message: string,
): Promise<FormState> {
  const actor = await assigner();
  const outcome = await assignFromPenalty(
    database(),
    actor,
    String(penaltyId),
    String(message),
  );
  if (outcome.kind === "refused") return { error: outcome.error, done: null };
  return { error: null, done: outcome.done };
}
