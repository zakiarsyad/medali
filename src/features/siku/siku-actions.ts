"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { cancelSikuEntry } from "./cancel-entry";
import { saveSikuEntry } from "./save-entry";
import { SIKU_ADDRESS } from "./siku-address";
import {
  readGroupPicks,
  type SikuPick,
  searchSikuStudents,
} from "./siku-picks";
import { KIND_WORDS } from "./siku-words";

/**
 * The signed-in account when it has the right Penilaian SIKU. Any other
 * is refused before anything of what it sent is read.
 */
async function enterer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "adjust_siku")) forbidden();
  return account;
}

/**
 * "Simpan penambahan" and "Simpan pengurangan". Who entered it is the
 * signed-in account, never a field.
 */
export async function saveSikuEntryAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await enterer();
  const saved = await saveSikuEntry(database(), actor, text(form, "id"), {
    kind: text(form, "kind"),
    reason: text(form, "reason"),
    points: text(form, "points"),
    day: text(form, "day"),
    note: text(form, "note"),
    basis: text(form, "basis"),
    studentIds: texts(form, "student"),
  });
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(SIKU_ADDRESS);
  const { kind, points, students } = saved.value;
  return {
    error: null,
    done: `${KIND_WORDS[kind]} ${points} poin SIKU disimpan untuk ${students} mahasiswa.`,
  };
}

/** The Aktif students the form offers for what was typed. */
export async function searchSikuStudentsAction(
  query: string,
): Promise<SikuPick[]> {
  await enterer();
  return searchSikuStudents(database(), query);
}

/** "Tambah satu kelompok pengasuhan": the Aktif members of the group chosen. */
export async function groupPicksAction(groupId: string): Promise<SikuPick[]> {
  await enterer();
  return readGroupPicks(database(), groupId);
}

/** "Batalkan" on an entry of the history. Who cancelled is the signed-in account. */
export async function cancelSikuEntryAction(id: string): Promise<FormState> {
  const actor = await enterer();
  const cancelled = await cancelSikuEntry(database(), actor, String(id));
  if (!cancelled.ok) return { error: cancelled.error, done: null };
  revalidatePath(SIKU_ADDRESS);
  return { error: null, done: "Penyesuaian dibatalkan." };
}
