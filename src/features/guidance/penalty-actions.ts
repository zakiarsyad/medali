"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { PENALTIES_ADDRESS } from "./penalty-address";
import type { PenaltyHistory } from "./penalty-consequences";
import { CONFIRMED } from "./penalty-input";
import { savedMessage } from "./penalty-messages";
import {
  type PenaltyPick,
  readPenaltyHistory,
  searchPenaltyStudents,
} from "./penalty-student";
import { saveDisciplinePenalty } from "./save-discipline-penalty";

/**
 * The signed-in account when it may record discipline penalties. Any
 * other is refused before anything of what it sent is read.
 */
async function recorder(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "record_discipline_penalties"))
    forbidden();
  return account;
}

/** "Mahasiswa" of "Catat pelanggaran": the students found for the text typed. */
export async function searchPenaltyStudentsAction(
  query: string,
): Promise<PenaltyPick[]> {
  const actor = await recorder();
  return searchPenaltyStudents(database(), actor, query);
}

/**
 * The history of the student picked, for "Konsekuensi"; null when not
 * theirs to record.
 */
export async function penaltyHistoryAction(
  studentId: string,
): Promise<PenaltyHistory | null> {
  const actor = await recorder();
  return readPenaltyHistory(database(), actor, String(studentId));
}

/** "Simpan pelanggaran". Who recorded it is the signed-in account, never a field. */
export async function saveDisciplinePenaltyAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await recorder();
  const saved = await saveDisciplinePenalty(
    database(),
    actor,
    text(form, "id"),
    {
      studentId: text(form, "studentId"),
      day: text(form, "day"),
      description: text(form, "description"),
      category: text(form, "category"),
      level: text(form, "level"),
      decisionNumber: text(form, "decisionNumber"),
      socialWorkForms: texts(form, "socialWorkForms"),
      socialWorkOther: text(form, "socialWorkOther"),
      socialWorkPlace: text(form, "socialWorkPlace"),
      socialWorkStart: text(form, "socialWorkStart"),
      confirmed: text(form, "confirmed") === CONFIRMED,
    },
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(PENALTIES_ADDRESS);
  const { name, status } = saved.value;
  return { error: null, done: savedMessage(name, status) };
}
