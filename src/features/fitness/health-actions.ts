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
import { FITNESS_ADDRESS } from "./fitness-address";
import { readFitnessLimits } from "./fitness-limits";
import {
  type HealthPick,
  type HealthSubject,
  readHealthSubject,
  searchHealthStudents,
} from "./health-subject";
import { savedNoteMessage } from "./health-words";
import { saveHealthNote } from "./save-health-note";

/**
 * The signed-in account when it has the right "Penilaian jasmani", which
 * writes health notes here. Any other is refused before anything of what
 * it sent is read; reading a note also asks for the right to read notes.
 */
async function noteWriter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "enter_fitness_scores")) forbidden();
  return account;
}

/** "Mahasiswa" of "Catatan kesehatan": the students found for the text typed. */
export async function searchHealthStudentsAction(
  query: string,
): Promise<HealthPick[]> {
  const actor = await noteWriter();
  return searchHealthStudents(database(), actor, query, campusDay());
}

/** The student picked: their test category and every note, or null when not theirs to write. */
export async function healthSubjectAction(
  studentId: string,
): Promise<HealthSubject | null> {
  const actor = await noteWriter();
  const db = database();
  const { limits } = await readFitnessLimits(db);
  return readHealthSubject(db, actor, studentId, limits, campusDay());
}

/** "Simpan catatan". Who saved the note is the signed-in account, never a field. */
export async function saveHealthNoteAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await noteWriter();
  const db = database();
  const { limits } = await readFitnessLimits(db);
  const saved = await saveHealthNote(
    db,
    actor,
    text(form, "id"),
    {
      studentId: text(form, "studentId"),
      examinedOn: text(form, "examinedOn"),
      examiner: text(form, "examiner"),
      illnesses: texts(form, "illness"),
      illnessNotes: texts(form, "illnessNote"),
      otherHistory: text(form, "otherHistory"),
      medicine: text(form, "medicine"),
      advice: text(form, "advice"),
      category: text(form, "category"),
    },
    limits,
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(FITNESS_ADDRESS);
  return {
    error: null,
    done: savedNoteMessage(saved.value.name, saved.value.category),
  };
}
