import { eq, sql } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import {
  CLARIFICATION_FILE_FAULTS,
  CLARIFICATION_FILE_RULE,
  FILE_MISSING,
} from "@/clarifications/clarification-file";
import {
  explanationFault,
  keptFileName,
  REASON_MISSING,
} from "@/clarifications/clarification-input";
import type { Database } from "@/db/connect";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import { dormClarifications, students } from "@/db/schema";
import { fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import { activityState } from "./activity-state";
import {
  DORM_CLARIFICATION_FOLDER,
  DORM_CLARIFICATION_REASONS,
  type DormClarificationReason,
  WAITING_STATUSES,
} from "./clarification-ids";
import {
  ABSENCE_NOT_FOUND,
  ASK_NOT_ALLOWED,
  CLARIFICATION_CLOSED,
  CLARIFICATION_SENT,
  FILE_NOT_KEPT,
  NO_FILE_STORAGE,
  NOT_A_RESIDENT,
  NOT_TO_CLARIFY,
} from "./clarification-messages";
import { readNewestStatus, readOwnMark } from "./clarification-store";
import { clarificationOpen } from "./clarification-time";
import { lockActivity } from "./count-store";
import { leaveMarkOf } from "./leave-marks";
import { readApprovedLeaves, spanOfHeld } from "./leave-store";
import { readStudentDorm } from "./student-dorm";

function refusal(error: string) {
  return { ok: false, error } as const;
}

const SENT = { ok: true, value: CLARIFICATION_SENT } as const;

/** A clarification as the form sends it: nothing in it is trusted. */
export interface SentDormClarification {
  activityId: string;
  /** The day of the activity, as year-month-day. */
  day: string;
  reason: string;
  explanation: string;
  /** Null when no file came with it. */
  file: SentFile | null;
}

/** The database keeps no text with this character; only a hand-made form sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

interface CheckedClarification {
  reason: DormClarificationReason;
  explanation: string;
  file: SentFile;
}

function reasonOf(sent: string): DormClarificationReason | null {
  return DORM_CLARIFICATION_REASONS.find((reason) => reason === sent) ?? null;
}

/**
 * What a form sent, checked: the explanation first, as the form asks for
 * it, then the file by its name, its size and what it holds.
 */
function checked(sent: SentDormClarification): Parsed<CheckedClarification> {
  const explanation = sent.explanation.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  const wrongExplanation = explanationFault(explanation);
  if (wrongExplanation !== null) return refusal(wrongExplanation);
  if (sent.file === null) return refusal(FILE_MISSING);
  const wrongFile = fileFault(sent.file, CLARIFICATION_FILE_RULE);
  if (wrongFile !== null) return refusal(CLARIFICATION_FILE_FAULTS[wrongFile]);
  const reason = reasonOf(sent.reason);
  if (reason === null) return refusal(REASON_MISSING);
  return { ok: true, value: { reason, explanation, file: sent.file } };
}

/** What a send of an absence answers now: the count it may go to, or an answer. */
type Standing =
  | { kind: "open"; countId: string }
  | { kind: "answered"; answer: Parsed<string> };

const WAITING: readonly string[] = WAITING_STATUSES;

function answered(answer: Parsed<string>): Standing {
  return { kind: "answered", answer };
}

/** Whether approved leave of the student covers the activity: they are Izin then. */
async function isOnLeave(
  db: Database,
  studentId: string,
  held: { day: string; startTime: string; endTime: string },
): Promise<boolean> {
  const leaves = await readApprovedLeaves(
    db,
    spanOfHeld(held),
    eq(students.id, studentId),
  );
  return leaveMarkOf(leaves, studentId, held) !== null;
}

/**
 * Whether the resident may clarify their mark at an activity on a day,
 * at a moment. Riwayat shows Tidak hadir only for an announced absence
 * of an activity that is over and that no approved leave covers, so only
 * that may be clarified, up to the end of the seventh day after. One
 * that waits is not replaced: the send is told it was sent, as a second
 * press of "Kirim klarifikasi" is the same send. An accepted one counts
 * already.
 */
async function standingOf(
  db: Database,
  studentId: string,
  sent: { activityId: string; day: string },
  at: Date,
): Promise<Standing> {
  const { day } = sent;
  const mark = await readOwnMark(db, studentId, sent.activityId, day);
  if (mark === null) return answered(NOT_TO_CLARIFY);
  const newest = await readNewestStatus(db, studentId, mark.countId);
  if (newest !== null && WAITING.includes(newest)) return answered(SENT);
  if (newest === "accepted" || !mark.isAbsent) return answered(NOT_TO_CLARIFY);
  const now = { day: campusDay(at), time: campusTime(at) };
  const held = { day, startTime: mark.startTime, endTime: mark.endTime };
  if (activityState(held, now) !== "over") return answered(NOT_TO_CLARIFY);
  if (await isOnLeave(db, studentId, held)) return answered(NOT_TO_CLARIFY);
  if (!clarificationOpen(day, now.day)) return answered(CLARIFICATION_CLOSED);
  return { kind: "open", countId: mark.countId };
}

/**
 * Puts the file in the file storage, checked once more on the way. A
 * storage that fails or cannot be reached is not an error to pass on:
 * the resident is told to try again, and the cause is logged, which
 * names no person and no key.
 */
async function keepSentFile(
  store: FileStore,
  file: SentFile,
): Promise<Parsed<{ key: string; contentType: string }>> {
  try {
    const kept = await keepFile(
      store,
      DORM_CLARIFICATION_FOLDER,
      file,
      CLARIFICATION_FILE_RULE,
    );
    if (!kept.ok) return refusal(CLARIFICATION_FILE_FAULTS[kept.fault]);
    return { ok: true, value: kept };
  } catch (error) {
    console.error("The file of a dorm clarification was not kept.", error);
    return FILE_NOT_KEPT;
  }
}

/**
 * Removes a kept file that got no clarification. When the storage fails
 * here too the send is not made to fail for it: the file stays,
 * unreachable by anyone, and the log says which one.
 */
async function dropFile(store: FileStore, fileKey: string): Promise<void> {
  try {
    await store.remove(fileKey);
  } catch (error) {
    console.error(`The kept file ${fileKey} has no clarification.`, error);
  }
}

type NewClarification = Pick<
  typeof dormClarifications.$inferInsert,
  | "studentId"
  | "reason"
  | "explanation"
  | "fileKey"
  | "fileName"
  | "fileContentType"
  | "fileSize"
  | "sentAt"
>;

/**
 * Adds a clarification that waits for BAM, unless the absence takes none
 * by now. It holds the activity first, as an announcement of its count
 * does, and then looks again: a second send at the same moment, or an
 * announcement that withdrew the absence, is saved first and seen here,
 * and then nothing is added. The database also keeps one waiting
 * clarification at most. Says whether it was added.
 */
function addSubmitted(
  db: Database,
  sent: { activityId: string; day: string },
  at: Date,
  clarification: NewClarification,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    if (!(await lockActivity(tx, sent.activityId))) return false;
    const standing = await standingOf(tx, clarification.studentId, sent, at);
    if (standing.kind === "answered") return false;
    const added = await tx
      .insert(dormClarifications)
      .values({
        ...clarification,
        countId: standing.countId,
        status: "submitted",
      })
      .onConflictDoNothing({
        target: [dormClarifications.countId, dormClarifications.studentId],
        where: sql`status in ('submitted', 'verified')`,
      })
      .returning({ id: dormClarifications.id });
    return added.length > 0;
  });
}

/**
 * Keeps a clarification of the resident of an account for their absence
 * at an activity on a day, to wait for BAM. Which student is never asked
 * from outside: it is the account's own, and they must live in a dorm on
 * the day it is sent. The absence must be one Riwayat
 * offers to clarify at `at`, the moment on the server's clock, in campus
 * time. The file goes to the file storage first and the clarification is
 * saved after; when that adds nothing the file is removed again, so one
 * file is kept however often the form is sent. `store` is null where
 * file keeping is off: nothing is saved there, and the resident is told
 * so.
 */
export async function sendDormClarification(
  db: Database,
  store: FileStore | null,
  account: Pick<Account, "roles" | "studentId">,
  sent: SentDormClarification,
  at: Date,
): Promise<Parsed<string>> {
  const { studentId } = account;
  if (!may(account.roles, "ask_dorm_clarification") || studentId === null) {
    return ASK_NOT_ALLOWED;
  }
  const asked = checked(sent);
  if (!asked.ok) return asked;
  if (!isUuid(sent.activityId) || !isDay(sent.day)) return ABSENCE_NOT_FOUND;
  const dorm = await readStudentDorm(db, studentId, campusDay(at));
  if (dorm === null) return NOT_A_RESIDENT;
  const before = await standingOf(db, studentId, sent, at);
  if (before.kind === "answered") return before.answer;
  if (store === null) return NO_FILE_STORAGE;

  const { reason, explanation, file } = asked.value;
  const kept = await keepSentFile(store, file);
  if (!kept.ok) return kept;
  let added = false;
  try {
    added = await addSubmitted(db, sent, at, {
      studentId,
      reason,
      explanation,
      fileKey: kept.value.key,
      fileName: keptFileName(file.name),
      fileContentType: kept.value.contentType,
      fileSize: file.bytes.length,
      sentAt: at,
    });
  } finally {
    if (!added) await dropFile(store, kept.value.key);
  }
  if (added) return SENT;
  // Another send of this resident, or an announcement, was saved in the
  // meantime.
  const since = await standingOf(db, studentId, sent, at);
  return since.kind === "answered" ? since.answer : FILE_NOT_KEPT;
}
