"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { SessionHistory } from "@/mental-health/session-view";
import type { Parsed } from "@/parsed";
import { openStudentSessions } from "./counselling-list-detail";

/**
 * The signed-in account when it has the right to read "Daftar
 * mahasiswa" of Konseling. Any other is refused before anything of what
 * it sent is read, and gets nothing back.
 */
async function lister(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "view_counselling_students")) forbidden();
  return account;
}

/**
 * "Rincian" of a student of "Daftar mahasiswa", 10 sessions for each step
 * asked. Each opening is logged.
 */
export async function openStudentSessionsAction(
  studentId: string,
  steps: number,
): Promise<Parsed<SessionHistory>> {
  const actor = await lister();
  return openStudentSessions(database(), actor, studentId, steps);
}
