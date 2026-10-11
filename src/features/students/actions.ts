"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { findAddedStudent } from "./added-students";
import { changeStudent, NOT_FOUND, removeStudent } from "./change-student";
import { isNim } from "./input-limits";
import { inputStudent } from "./input-student";
import { newStudentsAddress } from "./new-students-address";
import {
  cohortChoices,
  type InputContext,
  parseStudent,
  type StudentFields,
} from "./student-input";

async function studentInputter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "input_new_students")) forbidden();
  return account;
}

function readFields(form: FormData): StudentFields {
  return {
    nim: text(form, "nim"),
    name: text(form, "name"),
    studyProgramId: text(form, "studyProgramId"),
    entryPath: text(form, "entryPath"),
    sex: text(form, "sex"),
    cohortYear: text(form, "cohortYear"),
    className: text(form, "className"),
    province: text(form, "province"),
    originAgency: text(form, "originAgency"),
    status: text(form, "status"),
    categories: texts(form, "categories"),
  };
}

/** `keptYear` is the Angkatan a student already has, which they may keep. */
async function inputContext(
  db: Database,
  keptYear?: number,
): Promise<InputContext> {
  const cohortYears = cohortChoices(new Date().getFullYear(), keptYear);
  return { programs: await listStudyPrograms(db), cohortYears };
}

function refreshScreens(): void {
  // The menu and Ganti peran show the student accounts too.
  revalidatePath("/", "layout");
}

export async function addStudentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const inputter = await studentInputter();
  const db = database();
  const parsed = parseStudent(readFields(form), await inputContext(db));
  if (!parsed.ok) return { error: parsed.error, done: null };

  const added = await inputStudent(db, inputter, parsed.value);
  if (!added.ok) return { error: added.error, done: null };
  refreshScreens();
  return {
    error: null,
    done: `${parsed.value.name} ditambahkan sebagai mahasiswa.`,
  };
}

export async function changeStudentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const inputter = await studentInputter();
  const db = database();
  const fields = readFields(form);
  const before = isNim(fields.nim)
    ? await findAddedStudent(db, fields.nim)
    : null;
  if (!before) return { error: NOT_FOUND.error, done: null };
  const context = await inputContext(db, before.cohortYear);
  const parsed = parseStudent(fields, context);
  if (!parsed.ok) return { error: parsed.error, done: null };

  const changed = await changeStudent(db, inputter, parsed.value);
  if (!changed.ok) return { error: changed.error, done: null };
  refreshScreens();
  redirect(newStudentsAddress(text(form, "q")));
}

export async function removeStudentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const inputter = await studentInputter();
  const nim = text(form, "nim");
  if (!isNim(nim)) return { error: NOT_FOUND.error, done: null };

  const removed = await removeStudent(database(), inputter, nim);
  if (!removed.ok) return { error: removed.error, done: null };
  refreshScreens();
  return { error: null, done: `${removed.value} dihapus.` };
}
