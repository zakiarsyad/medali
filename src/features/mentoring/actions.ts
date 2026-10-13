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
import type { NoteFormState } from "./note-form-state";
import { parseNote } from "./note-input";
import { NOTES_ADDRESS } from "./notes-address";
import { saveNote } from "./save-note";

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
