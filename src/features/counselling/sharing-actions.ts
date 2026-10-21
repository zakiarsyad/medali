"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { askSharing, type SharingOutcome } from "./change-sharing";
import { readSharingPanel } from "./sharing-reads";
import type { SharingPanel } from "./sharing-view";

/**
 * The signed-in account when it has the right to share counselling
 * data. Any other is refused before anything of what it sent is read,
 * and gets nothing back.
 */
async function sharer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "share_counselling_data")) forbidden();
  return account;
}

/** "Publikasi data kesehatan mental" of the student picked. */
export async function lookUpSharingAction(
  studentId: string,
): Promise<Parsed<SharingPanel>> {
  const actor = await sharer();
  return readSharingPanel(database(), actor, studentId);
}

/** "Minta persetujuan mahasiswa", with what is shared with whom. */
export async function askSharingAction(
  studentId: string,
  data: string[],
  recipients: string[],
  summary: string,
): Promise<SharingOutcome> {
  const actor = await sharer();
  return askSharing(database(), actor, studentId, {
    data,
    recipients,
    summary,
  });
}
