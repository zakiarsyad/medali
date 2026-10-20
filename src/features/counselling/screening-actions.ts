"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { type ConsentPick, searchStudentsFor } from "./consent-picks";
import type { ConsentView } from "./consent-view";
import { saveScreening } from "./save-screening";
import { SCREENING_ADDRESS } from "./screening-address";
import { lookUpScreeningConsent } from "./screening-consent";
import { openScreeningDetail } from "./screening-detail";
import type { SentScreening } from "./screening-input";
import type { ScreeningDetailItem } from "./screening-view";

/**
 * The signed-in account when it has the right to record and read
 * screenings. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function screeningCounsellor(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "record_mental_health_screenings"))
    forbidden();
  return account;
}

/** "Rincian" of a student of "Daftar mahasiswa"; each opening is logged. */
export async function openScreeningDetailAction(
  studentId: string,
): Promise<ScreeningDetailItem[] | null> {
  const actor = await screeningCounsellor();
  return openScreeningDetail(database(), actor, studentId);
}

/** The students "Asesmen kesehatan mental" offers for what was typed. */
export async function searchScreeningStudentsAction(
  query: string,
): Promise<ConsentPick[]> {
  const actor = await screeningCounsellor();
  return searchStudentsFor(
    database(),
    actor,
    "record_mental_health_screenings",
    query,
  );
}

/** The consent to counselling of the student picked in the form. */
export async function lookUpScreeningConsentAction(
  studentId: string,
): Promise<Parsed<ConsentView | null>> {
  const actor = await screeningCounsellor();
  return lookUpScreeningConsent(database(), actor, studentId);
}

/**
 * "Simpan asesmen". `key` is made by the form, so a form sent twice is
 * kept once. The page is drawn again after a kept screening, so the
 * numbers and "Daftar mahasiswa" show it.
 */
export async function saveScreeningAction(
  key: string,
  sent: SentScreening,
): Promise<FormState> {
  const actor = await screeningCounsellor();
  const outcome = await saveScreening(database(), actor, key, sent);
  if (outcome.kind === "refused") return { error: outcome.error, done: null };
  revalidatePath(SCREENING_ADDRESS);
  return { error: null, done: outcome.done };
}
