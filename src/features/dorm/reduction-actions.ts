"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { reduceViolations, type SentOneReduction } from "./reduce-violations";
import { oneReducedWords } from "./reduction-words";
import { VIOLATIONS_ADDRESS } from "./violation-address";

/**
 * The signed-in account when it may reduce violations and undo a
 * reduction: Pengelola Asrama. Any other is refused before anything it
 * sent is read.
 */
async function reducer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "reduce_dorm_violations")) forbidden();
  return account;
}

/**
 * "Kurangi" on a violation in the box of one student, once confirmed.
 * Who reduced it is the signed-in account, never a field. The tab is read
 * again whatever the answer: a refusal often means the row is out of
 * date.
 */
export async function reduceOneViolationAction(
  sent: SentOneReduction,
): Promise<FormState> {
  const actor = await reducer();
  const reduced = await reduceViolations(
    database(),
    actor,
    {
      studentId: sent.studentId,
      violationIds: [sent.violationId],
      reason: sent.reason,
    },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  if (!reduced.ok) return { error: reduced.error, done: null };
  const [day = ""] = reduced.value.days;
  return { error: null, done: oneReducedWords(day) };
}
