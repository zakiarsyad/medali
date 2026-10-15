"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { FormState } from "@/ui/form-message";
import { issueWarningLetter, type SentIssue } from "./issue-letter";
import { type SentCall, scheduleWarningCall } from "./schedule-call";
import { VIOLATIONS_ADDRESS } from "./violation-address";

/**
 * The signed-in account when it may schedule calls and issue SPs:
 * Pengelola Asrama. Any other is refused before anything it sent is read.
 */
async function manager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "issue_dorm_warning_letters"))
    forbidden();
  return account;
}

/**
 * "Kirim panggilan" or "Ubah jadwal" in "Proses". The tab is read again
 * whatever the answer: a refusal often means the row is out of date.
 */
export async function scheduleWarningCallAction(
  sent: SentCall,
): Promise<FormState> {
  const actor = await manager();
  const saved = await scheduleWarningCall(
    database(),
    actor,
    {
      studentId: sent.studentId,
      level: sent.level,
      day: sent.day,
      time: sent.time,
      place: sent.place,
    },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  if (!saved.ok) return { error: saved.error, done: null };
  return { error: null, done: saved.value };
}

/**
 * "Terbitkan SP 1" or "Terbitkan SP 2 dan ajukan hukuman disiplin" in
 * "Proses", once confirmed. The tab is read again whatever the answer.
 */
export async function issueWarningLetterAction(
  sent: SentIssue,
): Promise<FormState> {
  const actor = await manager();
  const issued = await issueWarningLetter(
    database(),
    actor,
    {
      studentId: sent.studentId,
      level: sent.level,
      result: sent.result,
      proposalNote: sent.proposalNote,
    },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  if (!issued.ok) return { error: issued.error, done: null };
  return { error: null, done: issued.value };
}
