import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves, dormReturnReports } from "@/db/schema";
import { fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import { LEAVE_NOT_FOUND } from "./leave-messages";
import {
  NO_RETURN_PHOTO_STORAGE,
  REPORT_ALREADY_SENT,
  REPORT_NOT_A_RESIDENT,
  REPORT_NOT_ALLOWED,
  REPORT_WAITS,
  RETURN_PHOTO_NOT_KEPT,
  reportSentWords,
} from "./return-messages";
import {
  RETURN_PHOTO_FAULTS,
  RETURN_PHOTO_FOLDER,
  RETURN_PHOTO_RULE,
} from "./return-photo";
import { lateMinutes, reportFault } from "./return-rules";
import { hasOpenReport, lockLeave, type StoredLeave } from "./return-store";
import { readStudentDorm } from "./student-dorm";

function refusal(error: string) {
  return { ok: false, error } as const;
}

function sentAnswer(sentAt: Date, leave: StoredLeave): Parsed<string> {
  const words = reportSentWords(lateMinutes(sentAt, leave.endsAt));
  return { ok: true, value: words };
}

async function readOwnLeave(
  db: Database,
  studentId: string,
  leaveId: string,
): Promise<StoredLeave | undefined> {
  const [leave] = await db
    .select()
    .from(dormLeaves)
    .where(
      and(eq(dormLeaves.id, leaveId), eq(dormLeaves.studentId, studentId)),
    );
  return leave;
}

/**
 * What a report answers when its key is kept already, or null when it
 * is not: the same answer as the first time when it is this leave's, as
 * a second press of "Kirim laporan kembali" is the same report.
 */
async function answerOfKept(
  db: Database,
  reportId: string,
  leave: StoredLeave,
): Promise<Parsed<string> | null> {
  const [kept] = await db
    .select({
      leaveId: dormReturnReports.leaveId,
      sentAt: dormReturnReports.sentAt,
    })
    .from(dormReturnReports)
    .where(eq(dormReturnReports.id, reportId));
  if (!kept) return null;
  if (kept.leaveId !== leave.id) return REPORT_ALREADY_SENT;
  return sentAnswer(kept.sentAt, leave);
}

/**
 * Puts a photo in the file storage. A storage that fails or cannot be
 * reached is not an error to pass on: the resident is told to try
 * again, and the cause is logged, which names no person and no key.
 */
async function keepPhoto(
  store: FileStore,
  photo: SentFile,
): Promise<Parsed<string>> {
  try {
    const kept = await keepFile(
      store,
      RETURN_PHOTO_FOLDER,
      photo,
      RETURN_PHOTO_RULE,
    );
    if (!kept.ok) return refusal(RETURN_PHOTO_FAULTS[kept.fault]);
    return { ok: true, value: kept.key };
  } catch (error) {
    console.error("A return photo was not kept.", error);
    return RETURN_PHOTO_NOT_KEPT;
  }
}

/**
 * Removes a kept photo that got no report. When the storage fails here
 * too the send is not made to fail for it: the photo stays, unreachable
 * by anyone, and the log says which one.
 */
async function dropPhoto(store: FileStore, photoKey: string): Promise<void> {
  try {
    await store.remove(photoKey);
  } catch (error) {
    console.error(`The kept photo ${photoKey} has no report.`, error);
  }
}

type NewReport = Pick<
  typeof dormReturnReports.$inferInsert,
  "id" | "leaveId" | "photoKey" | "sentAt"
>;

/**
 * Adds a report that waits for BAM - BPHK, while its leave is still
 * approved and out. It holds the leave first, so a return recorded or
 * validated at the same moment is saved before or after it, never
 * beside it. The database keeps one report that is not rejected per
 * leave, and one per key: a second at once adds nothing. Says whether
 * it was added.
 */
function addReport(db: Database, report: NewReport): Promise<boolean> {
  return db.transaction(async (tx) => {
    const leave = await lockLeave(tx, report.leaveId);
    if (leave?.status !== "approved") return false;
    const added = await tx
      .insert(dormReturnReports)
      .values({ ...report, status: "waiting" })
      .onConflictDoNothing()
      .returning({ id: dormReturnReports.id });
    return added.length > 0;
  });
}

/** What a report answers that was not added, as things stand now. */
async function answerAfterLoss(
  db: Database,
  reportId: string,
  leave: StoredLeave,
  at: Date,
): Promise<Parsed<string>> {
  const kept = await answerOfKept(db, reportId, leave);
  if (kept !== null) return kept;
  const now = await readOwnLeave(db, leave.studentId, leave.id);
  if (now === undefined) return LEAVE_NOT_FOUND;
  return reportFault(now, at) ?? REPORT_WAITS;
}

/**
 * "Kirim laporan kembali": keeps the photo of the resident's report that
 * they are back from approved Izin pesiar or Izin khusus, to wait for
 * BAM - BPHK. Whose leave it is comes from the account: the leave of
 * another answers as one that does not exist. The time of the report is
 * `at`, the moment on the server's clock: what the phone says is not
 * asked. It opens some minutes before the return time; a report after
 * the return time is late, and says by how many minutes. A report that
 * waits is not replaced, while a new photo may follow a rejected one.
 * `reportId` is the key the form made: a report sent twice is kept once,
 * and both answer the same. The photo goes to the file storage first and
 * the report is saved after; when that adds nothing the photo is removed
 * again. `store` is null where file keeping is off: nothing is saved
 * there, and the resident is told so.
 */
export async function sendReturnReport(
  db: Database,
  store: FileStore | null,
  actor: Pick<Account, "roles" | "studentId">,
  leaveId: string,
  reportId: string,
  photo: SentFile,
  at: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "report_dorm_return")) return REPORT_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return REPORT_NOT_ALLOWED;
  if (!isUuid(leaveId) || !isUuid(reportId)) return LEAVE_NOT_FOUND;
  const fault = fileFault(photo, RETURN_PHOTO_RULE);
  if (fault !== null) return refusal(RETURN_PHOTO_FAULTS[fault]);
  const dorm = await readStudentDorm(db, studentId, campusDay(at));
  if (dorm === null) return REPORT_NOT_A_RESIDENT;
  const leave = await readOwnLeave(db, studentId, leaveId);
  if (!leave) return LEAVE_NOT_FOUND;
  const before = await answerOfKept(db, reportId, leave);
  if (before !== null) return before;
  const wrong = reportFault(leave, at);
  if (wrong !== null) return wrong;
  if (await hasOpenReport(db, leave.id)) return REPORT_WAITS;
  if (store === null) return NO_RETURN_PHOTO_STORAGE;

  const kept = await keepPhoto(store, photo);
  if (!kept.ok) return kept;
  let added = false;
  try {
    added = await addReport(db, {
      id: reportId,
      leaveId: leave.id,
      photoKey: kept.value,
      sentAt: at,
    });
  } finally {
    if (!added) await dropPhoto(store, kept.value);
  }
  if (added) return sentAnswer(at, leave);
  return answerAfterLoss(db, reportId, leave, at);
}
