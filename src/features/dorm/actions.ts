"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addRoom } from "./add-room";
import { changeRoom } from "./change-room";
import { removeRoom } from "./remove-room";
import { ROOMS_ADDRESS } from "./rooms-address";

async function roomManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_dorm_rooms")) forbidden();
  return account;
}

/** What a form is told after a change: the refusal, or what was done. */
function answer(
  changed: Parsed<string>,
  done: (value: string) => string,
): FormState {
  if (!changed.ok) return { error: changed.error, done: null };
  revalidatePath(ROOMS_ADDRESS);
  return { error: null, done: done(changed.value) };
}

export async function addRoomAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const added = await addRoom(database(), manager, {
    dorm: text(form, "dorm"),
    floor: text(form, "floor"),
    number: text(form, "number"),
    capacity: text(form, "capacity"),
  });
  return answer(added, (number) => `Kamar ${number} ditambahkan.`);
}

export async function changeRoomAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const changed = await changeRoom(database(), manager, text(form, "roomId"), {
    number: text(form, "number"),
    capacity: text(form, "capacity"),
  });
  return answer(changed, (number) => `Kamar ${number} diubah.`);
}

export async function removeRoomAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const removed = await removeRoom(database(), manager, text(form, "roomId"));
  return answer(removed, (number) => `Kamar ${number} dihapus.`);
}
