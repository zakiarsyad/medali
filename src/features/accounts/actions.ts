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
import { USERS_ADDRESS } from "./list-address";
import { addAccount, changeRoles, removeAccount } from "./manage-accounts";

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
