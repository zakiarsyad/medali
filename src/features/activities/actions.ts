"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { shapeFault } from "@/files/file-check";
import { fileStorage } from "@/files/file-storage";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { addSchedule } from "./add-schedule";
import {
  NOT_A_PICTURE,
  PHOTO_FAULTS,
  PHOTO_FILE_NAME,
  PHOTO_RULE,
} from "./attendance-photo";
import { changeSchedule, isOutdatedList } from "./change-schedule";
import { REMOVED_WORDS, savedWords } from "./form-words";
import { STUDENT_ACTIVITIES_ADDRESS } from "./history-address";
import { removeSchedule } from "./remove-schedule";
import type { SentSchedule } from "./schedule-input";
import { SCHEDULES_ADDRESS } from "./schedule-list-address";
import { sendAttendancePhoto } from "./send-attendance-photo";

async function activityManager(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "manage_activities")) forbidden();
  return account;
}

async function photoSender(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "send_attendance_photo")) forbidden();
  return account;
}

function sentSchedule(form: FormData): SentSchedule {
  return {
    activityId: text(form, "activity"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
    startTime: text(form, "startTime"),
    endTime: text(form, "endTime"),
    uploadCount: text(form, "uploadCount"),
    uploadUnit: text(form, "uploadUnit"),
    location: text(form, "location"),
    isRequired: text(form, "required") === "on",
  };
}

/**
 * What a refused save or removal answers. When someone else changed or
 * removed the schedule first, the list behind the form is read again, so
 * it shows what is there now.
 */
function refusal(error: string): FormState {
  if (isOutdatedList(error)) revalidatePath(SCHEDULES_ADDRESS);
  return { error, done: null };
}

export async function saveScheduleAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const manager = await activityManager();
  const sent = sentSchedule(form);
  // A form with a version changes the schedule it was opened for; one
  // without adds a new one under the key it made.
  const id = text(form, "id");
  const version = text(form, "version");
  const saved =
    version === ""
      ? await addSchedule(database(), manager, id, sent)
      : await changeSchedule(database(), manager, id, version, sent);
  if (!saved.ok) return refusal(saved.error);
  revalidatePath(SCHEDULES_ADDRESS);
  const { name, semester } = saved.value;
  return { error: null, done: savedWords(name, semester) };
}

export async function removeScheduleAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const removed = await removeSchedule(database(), manager, id);
  if (!removed.ok) return refusal(removed.error);
  revalidatePath(SCHEDULES_ADDRESS);
  return { error: null, done: REMOVED_WORDS };
}

/**
 * Keeps the attendance photo a student sends for one of their schedules.
 * The page is read again whatever the answer: a refusal often means the
 * card is out of date, as when the upload time has closed since.
 */
export async function sendAttendancePhotoAction(
  form: FormData,
): Promise<Parsed<string>> {
  const sender = await photoSender();
  const photo = form.get("photo");
  if (!(photo instanceof File)) return { ok: false, error: NOT_A_PICTURE };
  // Refused by its size before it is read. The name the browser gives is
  // not asked: the server names the photo itself.
  const wrongShape = shapeFault(PHOTO_FILE_NAME, photo.size, PHOTO_RULE);
  if (wrongShape) return { ok: false, error: PHOTO_FAULTS[wrongShape] };
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const sent = await sendAttendancePhoto(
    database(),
    fileStorage(),
    sender,
    text(form, "scheduleId"),
    { name: PHOTO_FILE_NAME, bytes },
    new Date(),
  );
  revalidatePath(STUDENT_ACTIVITIES_ADDRESS);
  return sent;
}
