"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import { fileStorage } from "@/files/file-storage";
import type { Parsed } from "@/parsed";
import { readCampusEmailEnding } from "@/settings";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { findAddedStudent } from "./added-students";
import { changeStudent, NOT_FOUND, removeStudent } from "./change-student";
import type { FilePreview } from "./file-preview";
import { parseGroupChoice } from "./fitting-group";
import {
  refusedForm,
  type StudentFormFields,
  type StudentFormState,
  savedForm,
} from "./form-values";
import { isNim } from "./input-limits";
import { inputStudent } from "./input-student";
import { savedMessage, saveStudentFile } from "./save-student-file";
import { previewStudentFile, type UploadedFile } from "./student-file-check";
import {
  cohortChoices,
  type InputContext,
  parseStudent,
} from "./student-input";
import { checkFileShape } from "./uploaded-file";

async function studentInputter(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "input_new_students")) forbidden();
  return account;
}

function readFields(form: FormData): StudentFormFields {
  return {
    nim: text(form, "nim"),
    name: text(form, "name"),
    email: text(form, "email"),
    studyProgramId: text(form, "studyProgramId"),
    entryPath: text(form, "entryPath"),
    sex: text(form, "sex"),
    cohortYear: text(form, "cohortYear"),
    className: text(form, "className"),
    province: text(form, "province"),
    originAgency: text(form, "originAgency"),
    status: text(form, "status"),
    categories: texts(form, "categories"),
    mentorGroupId: text(form, "mentorGroupId"),
  };
}

/** `keptYear` is the Angkatan a student already has, which they may keep. */
async function inputContext(
  db: Database,
  keptYear?: number,
): Promise<InputContext> {
  const cohortYears = cohortChoices(new Date().getFullYear(), keptYear);
  return {
    programs: await listStudyPrograms(db),
    cohortYears,
    campusEnding: readCampusEmailEnding(),
  };
}

function refreshScreens(): void {
  // The menu and Ganti peran show the student accounts too.
  revalidatePath("/", "layout");
}

export async function addStudentAction(
  before: StudentFormState,
  form: FormData,
): Promise<StudentFormState> {
  const inputter = await studentInputter();
  const db = database();
  const fields = readFields(form);
  const parsed = parseStudent(fields, await inputContext(db));
  if (!parsed.ok) return refusedForm(before, parsed.error, fields);
  const group = parseGroupChoice(fields.mentorGroupId);
  if (!group.ok) return refusedForm(before, group.error, fields);

  const added = await inputStudent(db, inputter, parsed.value, group.value);
  if (!added.ok) return refusedForm(before, added.error, fields);
  refreshScreens();
  return savedForm(
    before,
    `${parsed.value.name} ditambahkan sebagai mahasiswa.`,
  );
}

export async function changeStudentAction(
  before: StudentFormState,
  form: FormData,
): Promise<StudentFormState> {
  const inputter = await studentInputter();
  const db = database();
  const fields = readFields(form);
  const kept = isNim(fields.nim)
    ? await findAddedStudent(db, fields.nim)
    : null;
  if (!kept) return refusedForm(before, NOT_FOUND.error, fields);
  const context = await inputContext(db, kept.cohortYear);
  const parsed = parseStudent(fields, context);
  if (!parsed.ok) return refusedForm(before, parsed.error, fields);

  const changed = await changeStudent(db, inputter, parsed.value);
  if (!changed.ok) return refusedForm(before, changed.error, fields);
  refreshScreens();
  return savedForm(before, `Data ${parsed.value.name} diperbarui.`);
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

const NO_FILE = {
  ok: false,
  error: "Berkas tidak diterima. Pilih berkas CSV, lalu coba lagi.",
} as const;

/** The file of a sent form, refused by name or size before it is read. */
async function sentFile(form: FormData): Promise<Parsed<UploadedFile>> {
  const file = form.get("file");
  if (!(file instanceof File)) return NO_FILE;
  const wrongShape = checkFileShape(file.name, file.size);
  if (wrongShape) return { ok: false, error: wrongShape };
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { ok: true, value: { name: file.name, bytes } };
}

export async function previewStudentFileAction(
  form: FormData,
): Promise<Parsed<FilePreview>> {
  const inputter = await studentInputter();
  const file = await sentFile(form);
  if (!file.ok) return file;
  const db = database();
  const context = await inputContext(db);
  return previewStudentFile(db, inputter, file.value, context);
}

/** What the screen shows after a file is saved. */
export interface SavedFileShown {
  message: string;
  /** The file as it was at the save, for the rows that were skipped. */
  preview: FilePreview;
}

export async function saveStudentFileAction(
  form: FormData,
): Promise<Parsed<SavedFileShown>> {
  const inputter = await studentInputter();
  const file = await sentFile(form);
  if (!file.ok) return file;
  const db = database();
  const context = await inputContext(db);
  const saved = await saveStudentFile(
    db,
    fileStorage(),
    inputter,
    file.value,
    context,
  );
  if (!saved.ok) return saved;
  refreshScreens();
  const message = savedMessage(file.value.name, saved.value);
  return { ok: true, value: { message, preview: saved.value.preview } };
}
