"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import type { HealthPick } from "@/health-notes/note-subject";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { DORM_HEALTH_ADDRESS } from "./dorm-health-address";
import {
  type DormHealthSubject,
  readDormHealthSubject,
  searchDormHealthStudents,
} from "./dorm-health-subject";
import { savedDormHealthMessage } from "./dorm-health-words";
import type { SentMark } from "./mental-health-mark-input";
import { readMarkOf } from "./mental-health-marks";
import { saveDormHealthNote } from "./save-dorm-health-note";

/**
 * The signed-in account when it has the right to write residents' health
 * notes. Any other is refused before anything of what it sent is read;
 * reading a resident's notes also asks for the right to read the list.
 */
async function dormNoteWriter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "write_dorm_health_notes")) forbidden();
  return account;
}

/** "Mahasiswa" of "Catatan kesehatan": the residents found for the text typed. */
export async function searchDormHealthStudentsAction(
  query: string,
): Promise<HealthPick[]> {
  const actor = await dormNoteWriter();
  return searchDormHealthStudents(database(), actor, query, campusDay());
}

/**
 * The resident picked: their test category, every note and their
 * current mark, or null when not theirs to write.
 */
export async function dormHealthSubjectAction(
  studentId: string,
): Promise<DormHealthSubject | null> {
  const actor = await dormNoteWriter();
  const db = database();
  const { limits } = await readFitnessLimits(db);
  const day = campusDay();
  const subject = await readDormHealthSubject(
    db,
    actor,
    studentId,
    limits,
    day,
  );
  if (subject === null) return null;
  return { ...subject, mark: await readMarkOf(db, actor, studentId) };
}

/** "Potensi kesehatan mental" as sent, or null when the form had none. */
function sentMark(form: FormData): SentMark | null {
  if (!form.has("markCategory")) return null;
  return {
    category: text(form, "markCategory"),
    observation: text(form, "markObservation"),
  };
}

/**
 * "Simpan catatan", with "Potensi kesehatan mental" when the form has
 * it. Who saved is the signed-in account, never a field.
 */
export async function saveDormHealthNoteAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await dormNoteWriter();
  const db = database();
  const { limits } = await readFitnessLimits(db);
  const saved = await saveDormHealthNote(
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
    new Date(),
    sentMark(form),
  );
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(DORM_HEALTH_ADDRESS);
  return { error: null, done: savedDormHealthMessage(saved.value) };
}
