"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { may } from "@/auth/access";
import { type Account, isAccountId } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { ROLES } from "@/auth/roles";
import { database } from "@/db/database";
import { readCampusEmailEnding } from "@/settings";
import { text, texts } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { parseNewAccount, parseRoleChange } from "./account-input";
import { parseBamRoles } from "./bam-role-input";
import { changeBamRoles, removeBamRoles } from "./change-bam-roles";
import { giveBamRoles } from "./give-bam-roles";
import { USERS_ADDRESS } from "./list-address";
import { addAccount, changeRoles, removeAccount } from "./manage-accounts";
import { type FoundStudent, searchActiveStudents } from "./search-students";

async function userManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_users")) forbidden();
  return account;
}

/** Goes back to the list as it was, and never to an address outside it. */
function backToList(form: FormData): string {
  const back = text(form, "back");
  return back.startsWith(USERS_ADDRESS) ? back : USERS_ADDRESS;
}

function refreshScreens(): void {
  // The menu and Ganti peran show the accounts too.
  revalidatePath("/", "layout");
}

export async function addAccountAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const parsed = parseNewAccount(
    {
      name: text(form, "name"),
      title: text(form, "title"),
      nip: text(form, "nip"),
      email: text(form, "email"),
      roles: texts(form, "roles"),
      studyProgramId: text(form, "studyProgramId"),
      unit: text(form, "unit"),
    },
    readCampusEmailEnding(),
  );
  if (!parsed.ok) return { error: parsed.error, done: null };

  const added = await addAccount(database(), parsed.value, manager.id);
  if (!added.ok) return { error: added.error, done: null };
  refreshScreens();
  const roles = parsed.value.roles.map((role) => ROLES[role].title).join(", ");
  return {
    error: null,
    done: `${parsed.value.name} ditambahkan sebagai ${roles}.`,
  };
}

export async function changeRolesAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const parsed = parseRoleChange({
    accountId: text(form, "accountId"),
    roles: texts(form, "roles"),
    studyProgramId: text(form, "studyProgramId"),
    unit: text(form, "unit"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const changed = await changeRoles(database(), parsed.value, manager.id);
  if (!changed.ok) return { error: changed.error, done: null };
  refreshScreens();
  redirect(backToList(form));
}

export async function removeAccountAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const accountId = text(form, "accountId");
  if (!isAccountId(accountId)) {
    return { error: "Akun tidak ditemukan.", done: null };
  }
  const removed = await removeAccount(database(), accountId, manager.id);
  if (!removed.ok) return { error: removed.error, done: null };
  refreshScreens();
  return { error: null, done: `Akun ${text(form, "name")} dihapus.` };
}

/** The students offered in "Tambah pengurus BAM" for what was typed. */
export async function searchStudentsAction(
  query: string,
): Promise<FoundStudent[]> {
  const manager = await userManager();
  // A hand-made request may send anything in place of the text.
  if (typeof query !== "string") return [];
  return searchActiveStudents(database(), manager, query);
}

export async function giveBamRolesAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const parsed = parseBamRoles({
    accountId: text(form, "accountId"),
    roles: texts(form, "roles"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const given = await giveBamRoles(database(), manager, parsed.value);
  if (!given.ok) return { error: given.error, done: null };
  refreshScreens();
  const roles = parsed.value.roles.map((role) => ROLES[role].title).join(", ");
  return { error: null, done: `${given.value} ditambahkan sebagai ${roles}.` };
}

export async function changeBamRolesAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const parsed = parseBamRoles({
    accountId: text(form, "accountId"),
    roles: texts(form, "roles"),
  });
  if (!parsed.ok) return { error: parsed.error, done: null };

  const changed = await changeBamRoles(database(), manager, parsed.value);
  if (!changed.ok) return { error: changed.error, done: null };
  refreshScreens();
  redirect(backToList(form));
}

export async function removeBamRolesAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await userManager();
  const accountId = text(form, "accountId");
  if (!isAccountId(accountId)) {
    return { error: "Mahasiswa tidak ditemukan.", done: null };
  }
  const removed = await removeBamRoles(database(), manager, accountId);
  if (!removed.ok) return { error: removed.error, done: null };
  refreshScreens();
  return { error: null, done: `Peran BAM ${removed.value} dihapus.` };
}
