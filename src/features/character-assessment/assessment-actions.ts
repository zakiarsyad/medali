"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ASSESSMENT_ADDRESS } from "./assessment-address";
import {
  type AssessmentPick,
  searchAssessmentStudents,
} from "./assessment-picks";
import { saveAssessment, savedMessage } from "./save-assessment";

/**
 * The signed-in account when it has the right Asesmen karakter. Any
 * other is refused before anything of what it sent is read.
 */
async function assessor(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "assess_character")) forbidden();
  return account;
}

/** "Simpan asesmen". Who entered it is the signed-in account, never a field. */
export async function saveAssessmentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await assessor();
  const saved = await saveAssessment(database(), actor, text(form, "id"), {
    studentId: text(form, "studentId"),
    scores: {
      M: text(form, "score_M"),
      E: text(form, "score_E"),
      D: text(form, "score_D"),
      A: text(form, "score_A"),
      L: text(form, "score_L"),
      I: text(form, "score_I"),
    },
    source: text(form, "source"),
    note: text(form, "note"),
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(ASSESSMENT_ADDRESS);
  return { error: null, done: savedMessage(saved.value) };
}

/** The Aktif students the form offers for what was typed. */
export async function searchAssessmentStudentsAction(
  query: string,
): Promise<AssessmentPick[]> {
  const actor = await assessor();
  return searchAssessmentStudents(database(), actor, query);
}
