"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import {
  reduceViolations,
  type SentOneReduction,
  type SentReduction,
} from "./reduce-violations";
import {
  manyReducedWords,
  oneReducedWords,
  REDUCTION_UNDONE,
} from "./reduction-words";
import { undoReduction } from "./undo-reduction";

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
 * Who reduced it is the signed-in account, never a field. Pelanggaran,
 * Tugas saya and the number beside Tugas saya in the menu of every page
 * are read again whatever the answer, here and after every reduction or
 * undoing: a refusal often means the row is out of date.
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
  revalidatePath("/", "layout");
  if (!reduced.ok) return { error: reduced.error, done: null };
  const [day = ""] = reduced.value.days;
  return { error: null, done: oneReducedWords(day) };
}

/**
 * "Kurangi (n) pelanggaran" with the ticks of "Proses", once confirmed:
 * the answer says whether the call of the resident is still active.
 */
export async function reduceViolationsAction(
  sent: SentReduction,
): Promise<FormState> {
  const actor = await reducer();
  const reduced = await reduceViolations(
    database(),
    actor,
    {
      studentId: sent.studentId,
      violationIds: sent.violationIds,
      reason: sent.reason,
    },
    new Date(),
  );
  revalidatePath("/", "layout");
  if (!reduced.ok) return { error: reduced.error, done: null };
  const { days, standing } = reduced.value;
  return { error: null, done: manyReducedWords(days.length, standing) };
}

/**
 * "Batalkan" on a row of "Riwayat pengurangan pelanggaran", once
 * confirmed. Who undid it is the signed-in account.
 */
export async function undoReductionAction(id: string): Promise<FormState> {
  const actor = await reducer();
  const undone = await undoReduction(database(), actor, String(id));
  revalidatePath("/", "layout");
  if (!undone.ok) return { error: undone.error, done: null };
  return { error: null, done: REDUCTION_UNDONE };
}
