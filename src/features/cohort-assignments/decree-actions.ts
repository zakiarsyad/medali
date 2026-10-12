"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ASSIGNMENT_ADDRESS } from "./assignment-address";
import { cancelAssignment } from "./cancel-assignment";
import {
  type DecreeInput,
  type DecreeStep,
  decreeStepOf,
  parseDecree,
} from "./decree-input";
import { parseDraftKey } from "./draft-change-input";
import { fixAssignment } from "./fix-assignment";
import { NOT_UNDERSTOOD } from "./refusals";
import { saveDecree, submitDraft } from "./save-decree";

/**
 * The signed-in account when it may prepare a penetapan. Any other is
 * refused before anything of what it sent is read. Each step then checks
 * the right of its own, so preparing does not open "Tetapkan" or
 * "Batalkan penetapan" itself.
 */
async function preparer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "prepare_cohort_assignments"))
    forbidden();
  return account;
}

const STEP_WRITES = {
  save: saveDecree,
  submit: submitDraft,
  fix: fixAssignment,
};

function doneWords(step: DecreeStep, input: DecreeInput): string {
  if (step === "save") return "Draf disimpan.";
  if (step === "submit") return "Draf diajukan ke Kepala UPK.";
  return `Penetapan pengasuh angkatan ${input.cohortYear} berlaku.`;
}

/**
 * "Simpan draf", "Ajukan ke Kepala UPK" and "Tetapkan", each with the
 * number and the day of "4. Penetapan". The tab is read again also after
 * a refusal: one made from an older draft is shown the latest.
 */
export async function decreeStepAction(form: FormData): Promise<FormState> {
  const actor = await preparer();
  const step = decreeStepOf(text(form, "step"));
  if (step === null) return { error: NOT_UNDERSTOOD.error, done: null };
  const parsed = parseDecree({
    cohortYear: text(form, "cohortYear"),
    version: text(form, "version"),
    decreeNumber: text(form, "decreeNumber"),
    effectiveOn: text(form, "effectiveOn"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const taken = await STEP_WRITES[step](database(), actor, parsed.value);
  revalidatePath(ASSIGNMENT_ADDRESS);
  if (!taken.ok) return { error: taken.error, done: null };
  return { error: null, done: doneWords(step, parsed.value) };
}

/** "Batalkan penetapan", for the fixed penetapan that is shown. */
export async function cancelAction(form: FormData): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseDraftKey({
    cohortYear: text(form, "cohortYear"),
    version: text(form, "version"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const cancelled = await cancelAssignment(database(), actor, parsed.value);
  revalidatePath(ASSIGNMENT_ADDRESS);
  if (!cancelled.ok) return { error: cancelled.error, done: null };
  return { error: null, done: "Penetapan dibatalkan." };
}
