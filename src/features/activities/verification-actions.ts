"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { fileStorage } from "@/files/file-storage";
import type { BulkAnswer } from "./bulk-validation";
import { type Decision, decideAttendance } from "./decide-attendance";
import {
  type RecordActivity,
  type RecordAnswer,
  type RecordStudent,
  type SentRecord,
  sentRecord,
} from "./manual-record";
import { readRecordActivities } from "./record-activities";
import { recordAttendance } from "./record-attendance";
import { searchRecordStudents } from "./record-student";
import { rejectionNote } from "./rejection-reasons";
import { validateTicked } from "./validate-ticked";
import { VERIFICATION_ADDRESS } from "./verification-address";
import type { DecisionAnswer } from "./verification-card";

async function attendanceVerifier(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "verify_attendance")) forbidden();
  return account;
}

/**
 * Saves a decision on one photo. The numbers and the cards are read
 * again whatever the answer: a refusal often means the card is out of
 * date, as when someone else decided it first.
 */
async function decide(
  verifier: Account,
  attendanceId: string,
  decision: Decision,
): Promise<DecisionAnswer> {
  const answer = await decideAttendance(
    database(),
    verifier,
    attendanceId,
    decision,
    new Date(),
    fileStorage() !== null,
  );
  revalidatePath(VERIFICATION_ADDRESS);
  return answer;
}

/** "Validasi" on a card. */
export async function validateAttendanceAction(
  attendanceId: string,
): Promise<DecisionAnswer> {
  const verifier = await attendanceVerifier();
  return decide(verifier, attendanceId, { status: "valid" });
}

/**
 * "Validasi (n) terpilih": the ticked cards of the page shown. The
 * numbers and the cards are read again whatever the answer.
 */
export async function validateTickedAction(
  attendanceIds: string[],
): Promise<BulkAnswer> {
  const verifier = await attendanceVerifier();
  const answer = await validateTicked(
    database(),
    verifier,
    attendanceIds,
    new Date(),
    fileStorage() !== null,
  );
  revalidatePath(VERIFICATION_ADDRESS);
  return answer;
}

/** "Tolak" on a card, with the reason chosen and the note for "Lainnya". */
export async function rejectAttendanceAction(
  attendanceId: string,
  reason: string,
  note: string,
): Promise<DecisionAnswer> {
  const verifier = await attendanceVerifier();
  const kept = rejectionNote(reason, note);
  if (!kept.ok) {
    return { state: { error: kept.error, done: null }, card: null };
  }
  return decide(verifier, attendanceId, {
    status: "rejected",
    note: kept.value,
  });
}

/** The students "Catat kehadiran manual atau dispensasi" offers for what was typed. */
export async function searchRecordStudentsAction(
  query: string,
): Promise<RecordStudent[]> {
  const verifier = await attendanceVerifier();
  return searchRecordStudents(database(), verifier, query);
}

/** The activities of the picked student that have started. */
export async function readRecordActivitiesAction(
  studentId: string,
): Promise<RecordActivity[]> {
  const verifier = await attendanceVerifier();
  return readRecordActivities(database(), verifier, studentId, new Date());
}

/**
 * "Simpan" of "Catat kehadiran manual atau dispensasi". A record can
 * change what a card shows, so the numbers and the cards are read again.
 */
export async function recordAttendanceAction(
  sent: SentRecord,
): Promise<RecordAnswer> {
  const verifier = await attendanceVerifier();
  const answer = await recordAttendance(
    database(),
    verifier,
    sentRecord(sent),
    new Date(),
  );
  revalidatePath(VERIFICATION_ADDRESS);
  return answer;
}
