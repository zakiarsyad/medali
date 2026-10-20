"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { sendOwnSurvey } from "./send-own-survey";

const OWN_PROFILE_ADDRESS = "/saya";

/**
 * The signed-in account when it may answer the survey. Any other is
 * refused before anything of what it sent is read, and gets nothing back.
 */
async function answeringStudent(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "answer_own_survey")) forbidden();
  return account;
}

/**
 * "Kirim survei". Profil saya is drawn again after a kept answer, so the
 * card shows it as sent.
 */
export async function sendOwnSurveyAction(
  sent: unknown,
): Promise<Parsed<{ sentAt: Date }>> {
  const actor = await answeringStudent();
  const outcome = await sendOwnSurvey(database(), actor, sent);
  if (outcome.ok) revalidatePath(OWN_PROFILE_ADDRESS);
  return outcome;
}
