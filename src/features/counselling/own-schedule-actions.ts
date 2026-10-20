"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { cancelSchedule } from "./change-schedule";
import {
  acceptSchedule,
  askAnotherTime,
  type StudentMoveOutcome,
} from "./move-schedule";
import { registerCounselling } from "./register-counselling";
import type { SentAnotherTime } from "./schedule-rules";

const COUNSELLING_ADDRESS = "/konseling";

/**
 * The signed-in account when it has the right to register for
 * counselling. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function registeringStudent(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "register_own_counselling")) forbidden();
  return account;
}

/**
 * "Daftar konseling". The page is drawn again after a kept request, so
 * "Jadwal konseling saya" and the consent show it.
 */
export async function registerCounsellingAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await registeringStudent();
  const outcome = await registerCounselling(database(), actor, {
    topic: text(form, "topic"),
    day: text(form, "day"),
    hour: text(form, "hour"),
    way: text(form, "way"),
    story: text(form, "story"),
    consented: text(form, "consented") === "yes",
  });
  if (outcome.kind === "refused") return { error: outcome.error, done: null };
  revalidatePath(COUNSELLING_ADDRESS);
  return { error: null, done: outcome.done };
}

/**
 * The student's page is drawn again after every answer that reached a
 * request, so it shows the request as it is now, also after a refusal.
 */
function drawnAgain(outcome: StudentMoveOutcome): StudentMoveOutcome {
  revalidatePath(COUNSELLING_ADDRESS);
  return outcome;
}

/** "Terima jadwal ini". `version` is the request the page showed. */
export async function acceptScheduleAction(
  id: string,
  version: string,
): Promise<StudentMoveOutcome> {
  const actor = await registeringStudent();
  return drawnAgain(await acceptSchedule(database(), actor, id, version));
}

/** "Kirim permintaan" of "Minta waktu lain". */
export async function askAnotherTimeAction(
  id: string,
  version: string,
  sent: SentAnotherTime,
): Promise<StudentMoveOutcome> {
  const actor = await registeringStudent();
  return drawnAgain(await askAnotherTime(database(), actor, id, version, sent));
}

/** "Batalkan pendaftaran" and "Batalkan", once the student confirmed. */
export async function cancelScheduleAction(
  id: string,
  version: string,
): Promise<StudentMoveOutcome> {
  const actor = await registeringStudent();
  return drawnAgain(await cancelSchedule(database(), actor, id, version));
}
