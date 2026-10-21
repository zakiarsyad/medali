"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { openSharedDetail } from "./shared-detail";
import type { SharedDetail } from "./shared-view";

/**
 * The signed-in account when it has the right to read shared counselling
 * data. Any other is refused before anything it sent is read, and gets
 * nothing back.
 */
async function recipient(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "view_shared_counselling_data"))
    forbidden();
  return account;
}

/**
 * "Rincian" of a student of "Data yang dipublikasikan untuk Anda"; each
 * opening is logged.
 */
export async function openSharedDetailAction(
  studentId: string,
): Promise<Parsed<SharedDetail>> {
  const actor = await recipient();
  return openSharedDetail(database(), actor, studentId);
}
