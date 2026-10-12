"use server";

import { revalidatePath } from "next/cache";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { ASSIGNMENT_ADDRESS } from "./assignment-address";
import { chooseMentor } from "./choose-mentor";
import {
  parseDraftKey,
  parseMentorChoice,
  parseMove,
  type SentDraftKey,
} from "./draft-change-input";
import { fillDraftMentors } from "./fill-draft-mentors";
import { formAssignment } from "./form-assignment";
import { parseForming } from "./forming-input";
import { moveDraftMember } from "./move-draft-member";
import { preparer } from "./preparer";

/** "Bentuk kelompok" and "Bentuk ulang". */
export async function formGroupsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseForming({
    cohortYear: text(form, "cohortYear"),
    targetSize: text(form, "targetSize"),
    method: text(form, "method"),
    version: text(form, "version"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const formed = await formAssignment(database(), actor, parsed.value);
  // Also after a refusal: one made from an older draft is shown the latest.
  revalidatePath(ASSIGNMENT_ADDRESS);
  if (!formed.ok) return { error: formed.error, done: null };
  const { cohortYear } = parsed.value;
  return {
    error: null,
    done: `${formed.value} kelompok dibentuk untuk angkatan ${cohortYear}.`,
  };
}

function draftKey(form: FormData): SentDraftKey {
  return {
    cohortYear: text(form, "cohortYear"),
    version: text(form, "version"),
  };
}

/**
 * What a change to the groups of a draft answers. The tab is read again
 * also after a refusal: one made from an older draft is shown the latest.
 */
function changeAnswer(
  changed: Parsed<unknown>,
  done: string | null,
): FormState {
  revalidatePath(ASSIGNMENT_ADDRESS);
  if (!changed.ok) return { error: changed.error, done: null };
  return { error: null, done };
}

/** The choice of a mentor for one group, saved as soon as it is made. */
export async function chooseMentorAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseMentorChoice({
    ...draftKey(form),
    groupId: text(form, "groupId"),
    mentorId: text(form, "mentorId"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };
  const chosen = await chooseMentor(database(), actor, parsed.value);
  return changeAnswer(chosen, null);
}

/** "Isi otomatis yang kosong". */
export async function fillMentorsAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseDraftKey(draftKey(form));
  if (!parsed.ok) return { error: parsed.error, done: null };
  const filled = await fillDraftMentors(database(), actor, parsed.value);
  return changeAnswer(
    filled,
    "Pengasuh diisi otomatis, utamakan jurusan yang sama.",
  );
}

/** "Pindahkan ke…": a member moves to another group as soon as it is chosen. */
export async function moveMemberAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await preparer();
  const parsed = parseMove({
    ...draftKey(form),
    studentId: text(form, "studentId"),
    toGroupId: text(form, "toGroupId"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };
  const moved = await moveDraftMember(database(), actor, parsed.value);
  return changeAnswer(moved, null);
}
