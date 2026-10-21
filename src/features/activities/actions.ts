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
import { text, texts } from "@/ui/form-data";
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
import type { RecordStudent } from "./manual-record";
import { searchParticipantStudents } from "./participant-pool";
import { removeSchedule } from "./remove-schedule";
import type { SentSchedule } from "./schedule-input";
import {
  EXTRA_SCHEDULES_ADDRESS,
  SCHEDULES_ADDRESS,
} from "./schedule-list-address";
import type { MoveToConfirm, ScheduleAnswer } from "./schedule-move";
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
    kind: text(form, "kind"),
    activityId: text(form, "activity"),
    startsOn: text(form, "startsOn"),
    endsOn: text(form, "endsOn"),
    startTime: text(form, "startTime"),
    endTime: text(form, "endTime"),
    uploadCount: text(form, "uploadCount"),
    uploadUnit: text(form, "uploadUnit"),
    location: text(form, "location"),
    isRequired: text(form, "required") === "on",
    participants: {
      mode: text(form, "participantMode"),
      values: texts(form, "participant"),
    },
    agreedAttendances: text(form, "agreedAttendances"),
  };
}

/** Both tabs of schedules are read again: a save may move one between them. */
function rereadSchedules(): void {
  revalidatePath(SCHEDULES_ADDRESS);
  revalidatePath(EXTRA_SCHEDULES_ADDRESS);
}

/**
 * What a refused save or removal answers. When someone else changed or
 * removed the schedule first, the list behind the form is read again, so
 * it shows what is there now.
 */
function refusal(error: string): FormState {
  if (isOutdatedList(error)) rereadSchedules();
  return { error, done: null };
}

/** A refused save, with the number of attendances it asks about, or null. */
function saveRefusal(
  refused: { error: string } | MoveToConfirm,
): ScheduleAnswer {
  const attendances = "attendances" in refused ? refused.attendances : null;
  return { ...refusal(refused.error), attendances };
}

/**
 * When a change must first be agreed to, the answer holds the number of
 * attendances asked about, which the form sends back with its next press.
 */
export async function saveScheduleAction(
  _before: ScheduleAnswer,
  form: FormData,
): Promise<ScheduleAnswer> {
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
  if (!saved.ok) return saveRefusal(saved);
  rereadSchedules();
  return { error: null, done: savedWords(saved.value), attendances: null };
}

export async function removeScheduleAction(id: string): Promise<FormState> {
  const manager = await activityManager();
  const removed = await removeSchedule(database(), manager, id);
  if (!removed.ok) return refusal(removed.error);
  rereadSchedules();
  return { error: null, done: REMOVED_WORDS };
}

/** The Aktif students Per mahasiswa offers for what was typed. */
export async function searchParticipantStudentsAction(
  query: string,
): Promise<RecordStudent[]> {
  const manager = await activityManager();
  return searchParticipantStudents(database(), manager, query);
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
