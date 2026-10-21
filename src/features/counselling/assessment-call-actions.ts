"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { callFromAssessment } from "./assessment-calls";

/**
 * The signed-in account when it may call a student for counselling from
 * Asesmen karakter. Any other is refused before anything of what it sent
 * is read.
 */
async function caller(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "call_counselling_from_assessment"))
    forbidden();
  return account;
}

/** "Panggil konseling" of a row of "Teridentifikasi perlu pembinaan". */
export async function callFromAssessmentAction(
  studentId: string,
): Promise<FormState> {
  const actor = await caller();
  const outcome = await callFromAssessment(
    database(),
    actor,
    String(studentId),
  );
  if (outcome.kind === "refused") return { error: outcome.error, done: null };
  return { error: null, done: outcome.done };
}
