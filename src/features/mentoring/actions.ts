"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { AttendanceFormState } from "./attendance-form-state";
import { parseAttendance, sentMarks } from "./attendance-input";
import { MEETINGS_ADDRESS } from "./meetings-address";
import type { NoteFormState } from "./note-form-state";
import { parseNote } from "./note-input";
import { NOTES_ADDRESS } from "./notes-address";
import { saveAttendance } from "./save-attendance";
import { saveNote } from "./save-note";
import { saveScores } from "./save-scores";
import type { ScoreFormState } from "./score-form-state";
import {
  INDICATORS_VERSION_OF_SCORES,
  parseScores,
  sentScores,
} from "./score-input";
import { SCORES_ADDRESS } from "./scores-address";

/**
 * The signed-in account when it may write a mentoring note. Any other is
 * refused before anything of what it sent is read.
 */
async function writer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "write_mentoring_notes")) forbidden();
  return account;
}

/** "Simpan catatan". The writer is the signed-in account, never a field. */
export async function saveNoteAction(
  before: NoteFormState,
  form: FormData,
): Promise<NoteFormState> {
  const actor = await writer();
  const parsed = parseNote(
    {
      id: text(form, "id"),
      studentId: text(form, "studentId"),
      kind: text(form, "kind"),
      happenedOn: text(form, "happenedOn"),
      valueKeys: texts(form, "valueKeys"),
      note: text(form, "note"),
      followUp: text(form, "followUp"),
    },
    campusDay(),
  );
  if (!parsed.ok) {
    return { error: parsed.error, done: null, noteId: before.noteId };
  }

  const saved = await saveNote(database(), actor, parsed.value);
  if (!saved.ok) {
    return { error: saved.error, done: null, noteId: before.noteId };
  }
  revalidatePath(NOTES_ADDRESS);
  return {
    error: null,
    done: `Catatan disimpan untuk ${saved.value.studentName}.`,
    noteId: randomUUID(),
  };
}

/**
 * The signed-in account when it may fill in an attendance list. Any other
 * is refused before anything of what it sent is read.
 */
async function filler(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "fill_mentoring_attendance")) forbidden();
  return account;
}

/**
 * "Simpan daftar hadir". Who filled the list in is the signed-in account,
 * never a field.
 */
export async function saveAttendanceAction(
  before: AttendanceFormState,
  form: FormData,
): Promise<AttendanceFormState> {
  const actor = await filler();
  const parsed = parseAttendance({
    groupId: text(form, "groupId"),
    number: text(form, "number"),
    heldOn: text(form, "heldOn"),
    topic: text(form, "topic"),
    version: text(form, "version"),
    marks: sentMarks(form),
  });
  if (!parsed.ok) {
    return { error: parsed.error, done: null, version: before.version };
  }

  const saved = await saveAttendance(database(), actor, parsed.value);
  if (!saved.ok) {
    return { error: saved.error, done: null, version: before.version };
  }
  revalidatePath(MEETINGS_ADDRESS);
  return {
    error: null,
    done: `Daftar hadir pertemuan ${saved.value.number} disimpan.`,
    version: saved.value.version,
  };
}

/**
 * The signed-in account when it may give mentoring scores. Any other is
 * refused before anything of what it sent is read.
 */
async function scorer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "give_mentoring_scores")) forbidden();
  return account;
}

/**
 * "Simpan nilai". Who gives the scores is the signed-in account, never a
 * field. A save refused for a score that was saved in between reads the
 * tab anew too, so the form shows the score kept now.
 */
export async function saveScoresAction(
  _before: ScoreFormState,
  form: FormData,
): Promise<ScoreFormState> {
  const actor = await scorer();
  const parsed = parseScores({
    groupId: text(form, "groupId"),
    indicatorsVersion: text(form, INDICATORS_VERSION_OF_SCORES),
    scores: sentScores(form),
  });
  if (!parsed.ok) return { error: parsed.error, done: null, changedIds: [] };

  const saved = await saveScores(database(), actor, parsed.value);
  if (!saved.ok && "changedIds" in saved) {
    revalidatePath(SCORES_ADDRESS);
    return { error: saved.error, done: null, changedIds: saved.changedIds };
  }
  if (!saved.ok) return { error: saved.error, done: null, changedIds: [] };
  revalidatePath(SCORES_ADDRESS);
  return {
    error: null,
    done: `${saved.value.savedIds.length} nilai pengasuhan disimpan.`,
    changedIds: [],
  };
}
