"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openScreeningDetail } from "./screening-detail";
import type { ScreeningDetailItem } from "./screening-view";

/**
 * The signed-in account when it has the right to record and read
 * screenings. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function screeningCounsellor(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "record_mental_health_screenings")) {
    forbidden();
  }
  return account;
}

/** "Rincian" of a student of "Daftar mahasiswa"; each opening is logged. */
export async function openScreeningDetailAction(
  studentId: string,
): Promise<ScreeningDetailItem[] | null> {
  const actor = await screeningCounsellor();
  return openScreeningDetail(database(), actor, studentId);
}
