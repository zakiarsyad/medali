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
import { ACTIVITIES_ADDRESS } from "./activities-address";
import { CLARIFICATIONS_ADDRESS } from "./clarification-address";
import { doneWords } from "./clarification-decision";
import { decideDormClarification } from "./decide-clarification";
import { sendDormClarification } from "./send-clarification";

/**
 * The signed-in account when it may clarify its own absences. Any other
 * is refused before anything of what it sent is read.
 */
async function resident(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "ask_dorm_clarification")) forbidden();
  return account;
}

/** The signed-in account when it may check clarifications: BAM - BPHK and BAM - KI. */
async function checker(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "verify_dorm_clarification")) forbidden();
  return account;
}

/** The signed-in account when it may decide clarifications: Pengelola Asrama. */
async function decider(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "decide_dorm_clarification")) forbidden();
  return account;
}

function stateOf(answer: Parsed<unknown>, kind: string): FormState {
  if (!answer.ok) return { error: answer.error, done: null };
  return { error: null, done: doneWords(kind) };
}

/** The tab and the attendance a check or a decision changes are read again. */
function readAgain(): void {
  revalidatePath(CLARIFICATIONS_ADDRESS);
  revalidatePath(ACTIVITIES_ADDRESS);
}

/** "Terima, teruskan ke pengelola" or "Tolak klarifikasi" of BAM, with its Catatan. */
export async function verifyDormClarificationAction(
  id: string,
  kind: string,
  note: string,
): Promise<FormState> {
  const account = await checker();
  const answer = await decideDormClarification(database(), account, "verify", {
    id,
    kind,
    note,
  });
  readAgain();
  return stateOf(answer, kind);
}

/**
 * "Terima sebagai hadir", "Terima sebagai izin" or "Tolak" of Pengelola
 * Asrama, with its Catatan.
 */
export async function decideDormClarificationAction(
  id: string,
  kind: string,
  note: string,
): Promise<FormState> {
  const account = await decider();
  const answer = await decideDormClarification(database(), account, "decide", {
    id,
    kind,
    note,
  });
  readAgain();
  return stateOf(answer, kind);
}

/**
 * Keeps the clarification a resident sends for their absence at an
 * activity on a day. Riwayat is read again whatever the answer: a
 * refusal often means the row is out of date, as when BAM withdrew the
 * absence since.
 */
export async function sendDormClarificationAction(
  form: FormData,
): Promise<Parsed<string>> {
  const account = await resident();
  const file = form.get("file");
  const isSent = file instanceof File && file.size > 0;
  const sent = await sendDormClarification(
    database(),
    fileStorage(),
    account,
    {
      activityId: text(form, "activityId"),
      day: text(form, "day"),
      reason: text(form, "reason"),
      explanation: text(form, "explanation"),
      file: isSent
        ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }
        : null,
    },
    new Date(),
  );
  revalidatePath(ACTIVITIES_ADDRESS);
  return sent;
}
