"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import {
  markScheduleDone,
  markScheduleMissed,
  rescheduleSchedule,
} from "./change-schedule";
import {
  approveSchedule,
  type CounsellorMoveOutcome,
  proposeSchedule,
} from "./move-schedule";
import type { SentProposal } from "./schedule-rules";

/**
 * The signed-in account when it has the right to manage counselling
 * schedules. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function scheduler(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_counselling_schedules"))
    forbidden();
  return account;
}

/** "Setujui waktu ini". `version` is the request the card showed. */
export async function approveScheduleAction(
  id: string,
  version: string,
): Promise<CounsellorMoveOutcome> {
  const actor = await scheduler();
  return approveSchedule(database(), actor, id, version);
}

/** "Kirim usulan ke mahasiswa" of "Usulkan waktu lain". */
export async function proposeScheduleAction(
  id: string,
  version: string,
  sent: SentProposal,
): Promise<CounsellorMoveOutcome> {
  const actor = await scheduler();
  return proposeSchedule(database(), actor, id, version, sent);
}

/** "Simpan jadwal" of "Ubah jadwal". */
export async function rescheduleScheduleAction(
  id: string,
  version: string,
  sent: SentProposal,
): Promise<CounsellorMoveOutcome> {
  const actor = await scheduler();
  return rescheduleSchedule(database(), actor, id, version, sent);
}

/** "Tandai selesai", once Konselor confirmed. */
export async function markScheduleDoneAction(
  id: string,
  version: string,
): Promise<CounsellorMoveOutcome> {
  const actor = await scheduler();
  return markScheduleDone(database(), actor, id, version);
}

/** "Tidak hadir", once Konselor confirmed. */
export async function markScheduleMissedAction(
  id: string,
  version: string,
): Promise<CounsellorMoveOutcome> {
  const actor = await scheduler();
  return markScheduleMissed(database(), actor, id, version);
}
