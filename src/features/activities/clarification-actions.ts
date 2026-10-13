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
import { STUDENT_ACTIVITIES_ADDRESS } from "./history-address";
import { sendClarification } from "./send-clarification";

/** A student asks under the right they have for their own attendance. */
async function clarificationSender(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "send_attendance_photo")) forbidden();
  return account;
}

/**
 * Keeps the clarification a student sends for one of their schedules.
 * The page is read again whatever the answer: a refusal often means the
 * row is out of date, as when the clarification time has ended since.
 */
export async function sendClarificationAction(
  form: FormData,
): Promise<Parsed<string>> {
  const sender = await clarificationSender();
  const file = form.get("file");
  const isSent = file instanceof File && file.size > 0;
  const sent = await sendClarification(
    database(),
    fileStorage(),
    sender,
    {
      scheduleId: text(form, "scheduleId"),
      reason: text(form, "reason"),
      explanation: text(form, "explanation"),
      file: isSent
        ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }
        : null,
    },
    new Date(),
  );
  revalidatePath(STUDENT_ACTIVITIES_ADDRESS);
  return sent;
}
