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
import { autoFillRoom } from "./auto-fill-room";
import { changeRoom } from "./change-room";
import { placeResident, type SentPlace } from "./place-resident";
import { removeRoom } from "./remove-room";
import { ROOMS_ADDRESS } from "./rooms-address";
import { takeOutResident } from "./take-out-resident";

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

function sentPlace(form: FormData): SentPlace {
  return { roomId: text(form, "roomId"), studentId: text(form, "studentId") };
}

export async function placeResidentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const placed = await placeResident(database(), manager, sentPlace(form));
  return answer(placed, (done) => done);
}

export async function autoFillRoomAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const filled = await autoFillRoom(database(), manager, text(form, "roomId"));
  return answer(filled, (done) => done);
}

export async function takeOutResidentAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await roomManager();
  const out = await takeOutResident(database(), manager, sentPlace(form));
  return answer(out, (done) => done);
}
