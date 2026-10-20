"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { SentSession } from "./session-rules";
import { type SessionOutcome, writeSession } from "./write-session";

/**
 * The signed-in account when it has the right to keep counselling
 * sessions. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function keeper(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "keep_counselling_sessions")) forbidden();
  return account;
}

function sentSessionOf(form: FormData): SentSession {
  return {
    day: text(form, "day"),
    kind: text(form, "kind"),
    topic: text(form, "topic"),
    notes: text(form, "notes"),
    followUp: text(form, "followUp"),
    nextDay: text(form, "nextDay"),
  };
}

/** "Simpan sesi". Who wrote it is the signed-in account, never a field. */
export async function writeSessionAction(
  form: FormData,
): Promise<SessionOutcome> {
  const actor = await keeper();
  const press = { id: text(form, "id"), studentId: text(form, "studentId") };
  return writeSession(database(), actor, press, sentSessionOf(form));
}
