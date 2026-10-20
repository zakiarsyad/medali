"use server";

import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import { type ChangeOutcome, changeSession } from "./change-session";
import { readScheduleSession } from "./schedule-session";
import { readSessionHistory } from "./session-history";
import type { SentSession } from "./session-rules";
import type { ScheduleSession, SessionHistory } from "./session-view";
import { type SessionOutcome, writeSession } from "./write-session";

/**
 * The signed-in account when it has the right to keep counselling
 * sessions. Any other is refused before anything of what it sent is
 * read, and gets nothing back.
 */
async function keeper(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "keep_counselling_sessions")) forbidden();
  return account;
}

function sentSessionOf(form: FormData): SentSession {
  return {
    day: text(form, "day"),
    kind: text(form, "kind"),
    topic: text(form, "topic"),
    notes: text(form, "notes"),
    followUp: text(form, "followUp"),
    nextDay: text(form, "nextDay"),
  };
}

/** "Simpan sesi". Who wrote it is the signed-in account, never a field. */
export async function writeSessionAction(
  form: FormData,
): Promise<SessionOutcome> {
  const actor = await keeper();
  const press = {
    id: text(form, "id"),
    studentId: text(form, "studentId"),
    scheduleId: text(form, "scheduleId"),
  };
  return writeSession(database(), actor, press, sentSessionOf(form));
}

/** What "Tandai selesai" opens once the schedule is Selesai. */
export async function scheduleSessionAction(
  scheduleId: string,
): Promise<ScheduleSession> {
  const actor = await keeper();
  return readScheduleSession(database(), actor, scheduleId);
}

/**
 * "Riwayat sesi" of a student, 10 sessions for each step asked. Each
 * reading is logged.
 */
export async function readSessionHistoryAction(
  studentId: string,
  steps: number,
): Promise<Parsed<SessionHistory>> {
  const actor = await keeper();
  return readSessionHistory(database(), actor, studentId, steps);
}

/** "Simpan perubahan" of "Ubah". `version` is the session the form showed. */
export async function changeSessionAction(
  id: string,
  version: string,
  form: FormData,
): Promise<ChangeOutcome> {
  const actor = await keeper();
  return changeSession(database(), actor, id, version, sentSessionOf(form));
}
