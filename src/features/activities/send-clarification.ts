import { sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { activityClarifications } from "@/db/schema";
import { fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import { waitForOtherAttendanceWrites } from "./attendance-lock";
import {
  CLARIFICATION_FILE_FAULTS,
  CLARIFICATION_FILE_RULE,
  CLARIFICATION_FOLDER,
  FILE_MISSING,
} from "./clarification-file";
import {
  explanationFault,
  keptFileName,
  REASON_MISSING,
} from "./clarification-input";
import { type ClarificationReason, reasonOf } from "./clarification-reasons";
import { clarificationTimeOpen, mayBeClarified } from "./clarification-time";
import { readOwnClarifications } from "./own-clarifications";
import { type OwnSchedule, readOwnSchedule } from "./own-schedule";
import { readOwnStudent } from "./own-student";
import { NOT_OWN_ACTIVITY } from "./send-attendance-photo";
import { readOwnAttendances } from "./student-schedules";

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const CLARIFICATION_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengajukan klarifikasi.",
);

export const NOT_TO_CLARIFY = refusal(
  "Klarifikasi hanya untuk kegiatan yang tercatat tidak hadir atau presensinya ditolak.",
);

export const CLARIFICATION_CLOSED = refusal("Batas klarifikasi sudah lewat.");

/** Said where file keeping is off: on a preview without file storage. */
export const NO_FILE_STORAGE = refusal(
  "Lampiran belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
);

export const FILE_NOT_KEPT = refusal(
  "Lampiran tidak dapat disimpan. Coba lagi.",
);

export const CLARIFICATION_SENT = "Klarifikasi terkirim.";

const SENT = { ok: true, value: CLARIFICATION_SENT } as const;

/** A clarification as the form sends it: nothing in it is trusted. */
export interface SentClarification {
  scheduleId: string;
  reason: string;
  explanation: string;
  /** Null when no file came with it. */
  file: SentFile | null;
}

/** The database keeps no text with this character; only a hand-made form sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

interface CheckedClarification {
  reason: ClarificationReason;
  explanation: string;
  file: SentFile;
}

/**
 * What a form sent, checked: the explanation first, as the form asks for
 * it, then the file by its name, its size and what it holds.
 */
function checked(sent: SentClarification): Parsed<CheckedClarification> {
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

/**
 * What a send answers when the schedule takes no clarification from the
 * student on a day on campus, or null when it does. One that waits is
 * not replaced: the send is told it was sent, as a second press of
 * "Kirim klarifikasi" is the same send. Otherwise the student's newest
 * attendance must be one that may be clarified, and the time open.
 */
async function answerOfKept(
  db: Database,
  studentId: string,
  schedule: OwnSchedule,
  today: string,
): Promise<Parsed<string> | null> {
  const asked = await readOwnClarifications(db, studentId, [schedule.id]);
  if (asked.get(schedule.id)?.status === "submitted") return SENT;
  const kept = await readOwnAttendances(db, studentId, [schedule.id]);
  const attendance = kept.get(schedule.id)?.status ?? null;
  if (!mayBeClarified(attendance, schedule, today)) return NOT_TO_CLARIFY;
  if (!clarificationTimeOpen(schedule, today)) return CLARIFICATION_CLOSED;
  return null;
}

/**
 * Puts the file in the file storage, checked once more on the way. A
 * storage that fails or cannot be reached is not an error to pass on:
 * the student is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keepSentFile(
  store: FileStore,
  file: SentFile,
): Promise<Parsed<{ key: string; contentType: string }>> {
  try {
    const kept = await keepFile(
      store,
      CLARIFICATION_FOLDER,
      file,
      CLARIFICATION_FILE_RULE,
    );
    if (!kept.ok) return refusal(CLARIFICATION_FILE_FAULTS[kept.fault]);
    return { ok: true, value: kept };
  } catch (error) {
    console.error("The file of a clarification was not kept.", error);
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
  typeof activityClarifications.$inferInsert,
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
 * Adds a clarification that waits, unless the schedule takes none from
 * the student by now. It waits for any other write of this student's
 * attendance or clarification for the schedule and then looks again: a
 * second add at the same moment, or a record made by hand at that
 * moment, is saved first and seen here, and then nothing is added. The
 * database also keeps one waiting clarification at most. Says whether it
 * was added.
 */
function addSubmitted(
  db: Database,
  schedule: OwnSchedule,
  today: string,
  clarification: NewClarification,
): Promise<boolean> {
  const { studentId } = clarification;
  return db.transaction(async (tx) => {
    await waitForOtherAttendanceWrites(tx, studentId, schedule.id);
    const before = await answerOfKept(tx, studentId, schedule, today);
    if (before !== null) return false;
    const added = await tx
      .insert(activityClarifications)
      .values({
        ...clarification,
        scheduleId: schedule.id,
        status: "submitted",
        note: "",
      })
      .onConflictDoNothing({
        target: [
          activityClarifications.scheduleId,
          activityClarifications.studentId,
        ],
        where: sql`status = 'submitted'`,
      })
      .returning({ id: activityClarifications.id });
    return added.length > 0;
  });
}

/**
 * Keeps a clarification of the student of an account for a schedule, to
 * wait for Penilai Mahasiswa. Which student is never asked from outside:
 * it is the account's own. The schedule must be meant for them, their
 * newest attendance at it one that may be clarified, and the
 * clarification time open at `at`, the moment on the server's clock, in
 * campus time. The file goes to the file storage first and the
 * clarification is saved after; when that adds nothing the file is
 * removed again, so one file is kept however often the form is sent.
 * `store` is null where file keeping is off: nothing is saved there, and
 * the student is told so.
 */
export async function sendClarification(
  db: Database,
  store: FileStore | null,
  account: AccountForAccess,
  sent: SentClarification,
  at: Date,
): Promise<Parsed<string>> {
  const student = await readOwnStudent(db, account);
  if (student === null) return CLARIFICATION_NOT_ALLOWED;
  const asked = checked(sent);
  if (!asked.ok) return asked;
  const schedule = await readOwnSchedule(db, student, sent.scheduleId);
  if (schedule === null) return NOT_OWN_ACTIVITY;
  const today = campusDay(at);
  const before = await answerOfKept(db, student.id, schedule, today);
  if (before !== null) return before;
  if (store === null) return NO_FILE_STORAGE;

  const { reason, explanation, file } = asked.value;
  const kept = await keepSentFile(store, file);
  if (!kept.ok) return kept;
  let added = false;
  try {
    added = await addSubmitted(db, schedule, today, {
      studentId: student.id,
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
  // Another send of this student, or a record of their attendance, was
  // saved in the meantime.
  const since = await answerOfKept(db, student.id, schedule, today);
  return since ?? FILE_NOT_KEPT;
}
