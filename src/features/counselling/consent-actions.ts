"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import {
  type ConsentOutcome,
  changeConsentAsCounsellor,
} from "./change-consent";
import {
  type ConsentPick,
  lookUpConsent,
  searchConsentStudents,
} from "./consent-picks";
import type { ConsentView } from "./consent-view";

/**
 * The signed-in account when it has the right to ask for and record a
 * counselling consent. Any other is refused before anything of what it
 * sent is read, and gets nothing back.
 */
async function counsellor(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_counselling_consent"))
    forbidden();
  return account;
}

/** The students "Persetujuan konseling" offers for what was typed. */
export async function searchConsentStudentsAction(
  query: string,
): Promise<ConsentPick[]> {
  const actor = await counsellor();
  return searchConsentStudents(database(), actor, query);
}

/** The current consent of the student picked on "Persetujuan konseling". */
export async function lookUpConsentAction(
  studentId: string,
): Promise<Parsed<ConsentView | null>> {
  const actor = await counsellor();
  return lookUpConsent(database(), actor, studentId);
}

/** "Kirim permintaan persetujuan". `version` is the consent the panel showed. */
export async function askConsentAction(
  studentId: string,
  version: string,
): Promise<ConsentOutcome> {
  const actor = await counsellor();
  return changeConsentAsCounsellor(
    database(),
    actor,
    studentId,
    "ask",
    version,
  );
}

/** "Catat form tertulis yang sudah ditandatangani", once confirmed. */
export async function recordPaperConsentAction(
  studentId: string,
  version: string,
): Promise<ConsentOutcome> {
  const actor = await counsellor();
  return changeConsentAsCounsellor(
    database(),
    actor,
    studentId,
    "record_paper",
    version,
  );
}
