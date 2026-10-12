"use server";

import { revalidatePath } from "next/cache";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ASSIGNMENT_ADDRESS } from "./assignment-address";
import {
  type DecreeInput,
  type DecreeStep,
  decreeStepOf,
  parseDecree,
} from "./decree-input";
import { fixAssignment } from "./fix-assignment";
import { preparer } from "./preparer";
import { NOT_UNDERSTOOD } from "./refusals";
import { saveDecree, submitDraft } from "./save-decree";

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
