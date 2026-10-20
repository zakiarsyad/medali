"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { NOTES_ADDRESS } from "./note-address";
import { REMOVED, savedMessage } from "./note-messages";
import {
  type NotePick,
  readStudentBox,
  searchNoteStudents,
} from "./note-student";
import type { ActiveNote } from "./placed-notes";
import { removeViolationNote } from "./remove-violation-note";
import { saveViolationNote } from "./save-violation-note";

/**
 * The signed-in account when it may write violation notes. Any other is
 * refused before anything of what it sent is read.
 */
async function writer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "write_violation_notes")) forbidden();
  return account;
}

/** "Mahasiswa" of "Catatan pelanggaran": the students found for the text typed. */
export async function searchNoteStudentsAction(
  query: string,
): Promise<NotePick[]> {
  const actor = await writer();
  return searchNoteStudents(database(), actor, query);
}

/**
 * The box of the student picked: their active notes this semester, or
 * null when not theirs to write.
 */
export async function noteStudentBoxAction(
  studentId: string,
): Promise<ActiveNote[] | null> {
  const actor = await writer();
  return readStudentBox(database(), actor, String(studentId), campusDay());
}

/** "Simpan catatan". Who saved is the signed-in account, never a field. */
export async function saveViolationNoteAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await writer();
  const saved = await saveViolationNote(database(), actor, text(form, "id"), {
    studentId: text(form, "studentId"),
    day: text(form, "day"),
    description: text(form, "description"),
    punishment: text(form, "punishment"),
    otherPunishment: text(form, "otherPunishment"),
    remark: text(form, "remark"),
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(NOTES_ADDRESS);
  const { name, category } = saved.value;
  return { error: null, done: savedMessage(name, category) };
}

/** "Hapus" on a note. Who removed it is the signed-in account. */
export async function removeViolationNoteAction(
  id: string,
): Promise<FormState> {
  const actor = await writer();
  const removed = await removeViolationNote(database(), actor, String(id));
  if (!removed.ok) return { error: removed.error, done: null };
  revalidatePath(NOTES_ADDRESS);
  return { error: null, done: REMOVED };
}
