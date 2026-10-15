"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { saveViolations } from "./save-violations";
import { VIOLATIONS_ADDRESS } from "./violation-address";
import type { SentViolationRow } from "./violation-input";
import {
  searchViolationStudents,
  type ViolationPick,
} from "./violation-residents";
import { appealEndOf } from "./violation-status";
import { shownHour } from "./violation-words";

/**
 * The signed-in account when it may record violations. Any other is
 * refused before anything of what it sent is read.
 */
async function recorder(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "record_dorm_violations")) forbidden();
  return account;
}

/** The rows of the list, sent as one field of each kind per row. */
function sentRows(form: FormData): SentViolationRow[] {
  const students = texts(form, "student");
  const reasons = texts(form, "reason");
  const punishments = texts(form, "punishment");
  const others = texts(form, "otherPunishment");
  return students.map((studentId, place) => ({
    studentId,
    reason: reasons[place] ?? "",
    punishment: punishments[place] ?? "",
    otherPunishment: others[place] ?? "",
  }));
}

/**
 * "Simpan dan jadwalkan publikasi". Who recorded it is the signed-in
 * account, never a field.
 */
export async function saveViolationsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await recorder();
  const saved = await saveViolations(database(), actor, text(form, "id"), {
    day: text(form, "day"),
    announceDay: text(form, "announceDay"),
    announceTime: text(form, "announceTime"),
    rows: sentRows(form),
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(VIOLATIONS_ADDRESS);
  const { count, announcedAt } = saved.value;
  return {
    error: null,
    done: `${count} pelanggaran disimpan dan dijadwalkan diumumkan ${shownHour(announcedAt)}. Advokasi dapat diajukan sampai ${shownHour(appealEndOf(announcedAt))}.`,
  };
}

/** The residents the form offers for what was typed. */
export async function searchViolationStudentsAction(
  query: string,
): Promise<ViolationPick[]> {
  const actor = await recorder();
  return searchViolationStudents(
    database(),
    query,
    actor.studentId,
    campusDay(),
  );
}
