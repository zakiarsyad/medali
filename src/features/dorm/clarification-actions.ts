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
import { ACTIVITIES_ADDRESS } from "./activities-address";
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
