import { and, eq, isNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import {
  CLARIFICATION_FILE_FAULTS,
  CLARIFICATION_FILE_RULE,
} from "@/clarifications/clarification-file";
import { keptFileName } from "@/clarifications/clarification-input";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { fileFault, type SentFile } from "@/files/file-check";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import { APPEAL_PROOF_FOLDER } from "./appeal-ids";
import {
  ALREADY_APPEALED,
  APPEAL_NOT_ALLOWED,
  APPEAL_SENT,
  APPEAL_TIME_OVER,
  APPEAL_VIOLATION_NOT_FOUND,
  NO_PROOF_STORAGE,
  PROOF_NOT_KEPT,
} from "./appeal-messages";
import { appealStanding, keptReason, reasonFault } from "./appeal-rules";
import { readStudentDorm } from "./student-dorm";

/** An appeal as the form sends it: nothing in it is trusted. */
export interface SentAppeal {
  violationId: string;
  reason: string;
  /** Null when no proof came with it. */
  file: SentFile | null;
}

const SENT = { ok: true, value: APPEAL_SENT } as const;

function refusal(error: string) {
  return { ok: false, error } as const;
}

/** What a form sent, checked: the reason first, as the form asks for it, then the proof. */
function checked(sent: SentAppeal): Parsed<string> {
  const wrongReason = reasonFault(sent.reason);
  if (wrongReason !== null) return refusal(wrongReason);
  if (sent.file === null) return { ok: true, value: keptReason(sent.reason) };
  const wrongFile = fileFault(sent.file, CLARIFICATION_FILE_RULE);
  if (wrongFile !== null) return refusal(CLARIFICATION_FILE_FAULTS[wrongFile]);
  return { ok: true, value: keptReason(sent.reason) };
}

/**
 * Whether the resident's own violation may be appealed at `at`: null
 * when it may, or the answer that says why not. A violation of another
 * resident answers as one that is not there, so nobody learns of it.
 */
async function refusalOf(
  db: Database,
  studentId: string,
  violationId: string,
  at: Date,
): Promise<Parsed<string> | null> {
  const [found] = await db
    .select({
      announcedAt: dormViolations.announcedAt,
      appealId: dormViolationAppeals.id,
    })
    .from(dormViolations)
    .leftJoin(
      dormViolationAppeals,
      eq(dormViolationAppeals.violationId, dormViolations.id),
    )
    .where(
      and(
        eq(dormViolations.id, violationId),
        eq(dormViolations.studentId, studentId),
        isNull(dormViolations.cancelledAt),
      ),
    );
  if (!found) return APPEAL_VIOLATION_NOT_FOUND;
  const standing = appealStanding(
    found.announcedAt,
    found.appealId !== null,
    at,
  );
  if (standing === "not_announced") return APPEAL_VIOLATION_NOT_FOUND;
  if (standing === "appealed") return ALREADY_APPEALED;
  if (standing === "over") return APPEAL_TIME_OVER;
  return null;
}

/** The proof as it is kept, or null for an appeal without one. */
interface KeptProof {
  fileKey: string;
  fileName: string;
  fileContentType: string;
  fileSize: number;
}

/**
 * Puts the proof in the file storage, checked once more on the way. A
 * storage that fails or cannot be reached is not an error to pass on:
 * the resident is told to try again, and the cause is logged, which
 * names no person and no key.
 */
async function keepProof(
  store: FileStore,
  file: SentFile,
): Promise<Parsed<KeptProof>> {
  try {
    const kept = await keepFile(
      store,
      APPEAL_PROOF_FOLDER,
      file,
      CLARIFICATION_FILE_RULE,
    );
    if (!kept.ok) return refusal(CLARIFICATION_FILE_FAULTS[kept.fault]);
    return {
      ok: true,
      value: {
        fileKey: kept.key,
        fileName: keptFileName(file.name),
        fileContentType: kept.contentType,
        fileSize: file.bytes.length,
      },
    };
  } catch (error) {
    console.error("The proof of an appeal was not kept.", error);
    return PROOF_NOT_KEPT;
  }
}

/**
 * Removes a kept proof that got no appeal. When the storage fails here
 * too the send is not made to fail for it: the file stays, unreachable
 * by anyone, and the log says which one.
 */
async function dropProof(store: FileStore, fileKey: string): Promise<void> {
  try {
    await store.remove(fileKey);
  } catch (error) {
    console.error(`The kept file ${fileKey} has no appeal.`, error);
  }
}

/**
 * Adds the appeal with its line in the log, unless the violation has one
 * already: the database keeps one per violation, so of two sends at the
 * same moment the second adds nothing. Says whether it was added.
 */
function addAppeal(
  db: Database,
  actorId: string,
  appeal: typeof dormViolationAppeals.$inferInsert,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const added = await tx
      .insert(dormViolationAppeals)
      .values(appeal)
      .onConflictDoNothing({ target: dormViolationAppeals.violationId })
      .returning({ id: dormViolationAppeals.id });
    if (added.length === 0) return false;
    await tx.insert(dormViolationChanges).values({
      violationId: appeal.violationId,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "appealed",
    });
    return true;
  });
}

/** Whether the account may appeal: a student who lives in a dorm on the day of `at`. */
async function residentOf(
  db: Database,
  account: Pick<AccountForAccess, "roles" | "studentId">,
  at: Date,
): Promise<string | null> {
  const { studentId } = account;
  if (!may(account.roles, "appeal_own_dorm_violation")) return null;
  if (studentId === null) return null;
  const dorm = await readStudentDorm(db, studentId, campusDay(at));
  return dorm === null ? null : studentId;
}

/**
 * "Kirim advokasi": keeps the appeal of the resident of an account on
 * their own violation, to wait for BAM. Which student is never asked
 * from outside: it is the account's own. The violation must be announced
 * and still within its appeal time at `at`, the moment on the server's
 * clock, and have no appeal yet. The proof, when one came, goes to the
 * file storage first and the appeal is saved after; when that adds
 * nothing the proof is removed again. `store` is null where file keeping
 * is off: an appeal with a proof is refused there, and one without is
 * kept.
 */
export async function sendViolationAppeal(
  db: Database,
  store: FileStore | null,
  account: Pick<AccountForAccess, "id" | "roles" | "studentId">,
  sent: SentAppeal,
  at: Date,
): Promise<Parsed<string>> {
  const studentId = await residentOf(db, account, at);
  if (studentId === null) return APPEAL_NOT_ALLOWED;
  const reason = checked(sent);
  if (!reason.ok) return reason;
  if (!isUuid(sent.violationId)) return APPEAL_VIOLATION_NOT_FOUND;
  const before = await refusalOf(db, studentId, sent.violationId, at);
  if (before !== null) return before;

  const appeal = {
    violationId: sent.violationId,
    reason: reason.value,
    sentAt: at,
  };
  if (sent.file === null) {
    const added = await addAppeal(db, account.id, appeal);
    return added ? SENT : ALREADY_APPEALED;
  }
  if (store === null) return NO_PROOF_STORAGE;
  const proof = await keepProof(store, sent.file);
  if (!proof.ok) return proof;
  let added = false;
  try {
    added = await addAppeal(db, account.id, { ...appeal, ...proof.value });
  } finally {
    if (!added) await dropProof(store, proof.value.fileKey);
  }
  return added ? SENT : ALREADY_APPEALED;
}
