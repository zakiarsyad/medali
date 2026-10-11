"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { inputStudent } from "./input-student";
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

async function inputContext(db: Database): Promise<InputContext> {
  return {
    programs: await listStudyPrograms(db),
    cohortYears: cohortChoices(new Date().getFullYear()),
  };
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
