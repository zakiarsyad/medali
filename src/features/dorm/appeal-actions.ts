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
import { sendViolationAppeal } from "./send-appeal";
import { VIOLATIONS_ADDRESS } from "./violation-address";

/**
 * The signed-in account when it may appeal its own violations. Any other
 * is refused before anything of what it sent is read.
 */
async function resident(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "appeal_own_dorm_violation")) forbidden();
  return account;
}

/**
 * "Kirim advokasi" of a resident on a violation of their own. The tab is
 * read again whatever the answer: a refusal often means the row is out
 * of date, as when the appeal time ended since.
 */
export async function sendViolationAppealAction(
  form: FormData,
): Promise<Parsed<string>> {
  const account = await resident();
  const file = form.get("file");
  const isSent = file instanceof File && file.size > 0;
  const sent = await sendViolationAppeal(
    database(),
    fileStorage(),
    account,
    {
      violationId: text(form, "violationId"),
      reason: text(form, "reason"),
      file: isSent
        ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }
        : null,
    },
    new Date(),
  );
  revalidatePath(VIOLATIONS_ADDRESS);
  return sent;
}
