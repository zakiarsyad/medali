import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  activityAttendanceChanges,
  activityAttendances,
  activitySchedules,
} from "@/db/schema";
import { countedAtEither } from "./counted-students";
import { mayVerify } from "./may-verify";
import { rejectedWords } from "./student-activity-words";
import type { DecisionAnswer } from "./verification-card";
import {
  cardOf,
  IS_CARD,
  OF_ATTENDANCE,
  storedCards,
} from "./verification-cards";

/** What Pegawai UPK decides on a photo: it is valid, or rejected for a reason. */
export type Decision =
  | { status: "valid" }
  | { status: "rejected"; note: string };

export const VERIFY_NOT_ALLOWED = "Anda tidak berhak memverifikasi presensi.";
export const CARD_NOT_FOUND =
  "Presensi ini tidak ditemukan. Muat ulang halaman.";
export const DECIDED_BY_OTHER =
  "Presensi ini sudah diputuskan oleh petugas lain.";
export const VALIDATED = "Presensi divalidasi.";

/** How a decision on one attendance ended. */
export type DecisionEnd = "decided" | "already-decided" | "not-found";

/**
 * The attendance as it is stored, held so that nobody else decides it
 * until this decision is saved: a second decision at the same moment
 * waits here, and then finds it decided.
 */
async function holdCard(db: Database, attendanceId: string) {
  const [held] = await db
    .select({
      status: activityAttendances.status,
      note: activityAttendances.note,
    })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .where(and(IS_CARD, eq(activityAttendances.id, attendanceId)))
    .for("update", { of: activityAttendances });
  return held;
}

/**
 * Decides one waiting attendance and writes the line of the log, both or
 * neither. Only a photo that still waits is decided: the first decision
 * counts. Whether the account may decide is checked by the caller.
 */
export function decideOne(
  db: Database,
  byId: string,
  attendanceId: string,
  decision: Decision,
  at: Date,
): Promise<DecisionEnd> {
  return db.transaction(async (tx) => {
    const before = await holdCard(tx, attendanceId);
    if (before === undefined) return "not-found";
    if (before.status !== "waiting") return "already-decided";
    const note = decision.status === "rejected" ? decision.note : "";
    await tx
      .update(activityAttendances)
      .set({ status: decision.status, note, decidedAt: at, decidedBy: byId })
      .where(eq(activityAttendances.id, attendanceId));
    await tx.insert(activityAttendanceChanges).values({
      attendanceId,
      changedBy: byId,
      changedAt: at,
      statusBefore: before.status,
      noteBefore: before.note,
      statusAfter: decision.status,
      noteAfter: note,
    });
    return "decided";
  });
}

function doneWords(decision: Decision): string {
  if (decision.status === "valid") return VALIDATED;
  return rejectedWords(decision.note);
}

function refused(error: string): DecisionAnswer {
  return { state: { error, done: null }, card: null };
}

/** The card of an attendance as it stands now, or null when it is no card. */
async function readCard(db: Database, id: string, keepsPhotos: boolean) {
  const [stored] = await storedCards(
    db,
    and(IS_CARD, eq(activityAttendances.id, id)),
    await countedAtEither(db),
  );
  return stored === undefined ? null : cardOf(stored, keepsPhotos);
}

/**
 * Validates or rejects the photo of one attendance, for an account that
 * may verify attendance; anyone else is refused before anything is
 * read. The answer holds the card as it stands afterwards, also when
 * someone else decided it first, so the screen shows what is true now.
 * `attendanceId` comes from outside and is not trusted, and `at` is the
 * moment on the server's clock.
 */
export async function decideAttendance(
  db: Database,
  account: AccountForAccess,
  attendanceId: string,
  decision: Decision,
  at: Date,
  keepsPhotos: boolean,
): Promise<DecisionAnswer> {
  if (!mayVerify(account)) return refused(VERIFY_NOT_ALLOWED);
  if (!isUuid(attendanceId)) return refused(CARD_NOT_FOUND);
  const end = await decideOne(db, account.id, attendanceId, decision, at);
  if (end === "not-found") return refused(CARD_NOT_FOUND);
  const card = await readCard(db, attendanceId, keepsPhotos);
  if (end === "already-decided") {
    return { state: { error: DECIDED_BY_OTHER, done: null }, card };
  }
  return { state: { error: null, done: doneWords(decision) }, card };
}
