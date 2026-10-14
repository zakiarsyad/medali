"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { fileStorage } from "@/files/file-storage";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import { REQUEST_PHOTO_FILE_NAME } from "./request-photo";
import { type SentPhoto, sendSikuRequest } from "./send-request";
import { SIKU_ADDRESS } from "./siku-address";

/**
 * The signed-in account when it may ask for a SIKU gain. Any other is
 * refused before anything of what it sent is read.
 */
async function asker(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "ask_siku_addition")) forbidden();
  return account;
}

async function bytesOf(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

/**
 * The photos a form sent, each with its small copy, in order. The name
 * of a picked file is not asked: the server names each photo itself. A
 * part that is no file is sent as an empty one, which the checks refuse.
 */
async function sentPhotos(form: FormData): Promise<SentPhoto[]> {
  const photos = form.getAll("photo");
  const thumbs = form.getAll("thumb");
  const sent: SentPhoto[] = [];
  for (const [at, photo] of photos.entries()) {
    const thumb = thumbs[at];
    sent.push({
      photo: {
        name: REQUEST_PHOTO_FILE_NAME,
        bytes: photo instanceof File ? await bytesOf(photo) : new Uint8Array(),
      },
      thumb: {
        name: REQUEST_PHOTO_FILE_NAME,
        bytes: thumb instanceof File ? await bytesOf(thumb) : new Uint8Array(),
      },
    });
  }
  return sent;
}

/**
 * "Kirim pengajuan": whose request it is comes from the signed-in
 * account, never from a field.
 */
export async function sendSikuRequestAction(
  form: FormData,
): Promise<Parsed<string>> {
  const actor = await asker();
  const sent = await sendSikuRequest(
    database(),
    fileStorage(),
    actor,
    text(form, "id"),
    {
      reason: text(form, "reason"),
      day: text(form, "day"),
      report: text(form, "report"),
      photos: await sentPhotos(form),
    },
    new Date(),
  );
  if (sent.ok) revalidatePath(SIKU_ADDRESS);
  return sent;
}
