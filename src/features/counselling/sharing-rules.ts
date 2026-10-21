import {
  CURRENT_SHARING_STATUSES,
  SHARED_DATA,
  type SharedData,
  type SharingRecipient,
  type SharingStatus,
  type SharingStep,
  type SharingWay,
} from "./sharing-ids";
import { NO_SCREENING, NO_SESSION } from "./sharing-words";

/** What Konselor, the student, or a withdrawn consent does to a sharing. */
export type SharingMove = SharingStep;

export type CounsellorSharingMove = Extract<
  SharingMove,
  "ask" | "record_paper" | "publish" | "cancel"
>;

export type StudentSharingMove = Extract<
  SharingMove,
  "approve" | "decline" | "withdraw"
>;

const COUNSELLOR_MOVES: readonly CounsellorSharingMove[] = [
  "ask",
  "record_paper",
  "publish",
  "cancel",
];

const STUDENT_MOVES: readonly StudentSharingMove[] = [
  "approve",
  "decline",
  "withdraw",
];

/** Null for a student with no sharing at all. */
type Current = SharingStatus | null;

export function isCurrentSharing(status: SharingStatus): boolean {
  const current: readonly SharingStatus[] = CURRENT_SHARING_STATUSES;
  return current.includes(status);
}

function mayAsk(current: Current): boolean {
  return current === null || !isCurrentSharing(current);
}

/**
 * What a sharing becomes after a move, or null when the move is not
 * allowed from its status. A request is new only when none is current.
 */
export function sharingAfter(
  move: SharingMove,
  current: Current,
): SharingStatus | null {
  if (move === "ask") return mayAsk(current) ? "waiting" : null;
  if (current === null) return null;
  if (move === "publish") return current === "approved" ? "published" : null;
  if (move === "cancel") return isCurrentSharing(current) ? "cancelled" : null;
  if (move === "consent_withdrawn") {
    return isCurrentSharing(current) ? "withdrawn" : null;
  }
  if (move === "withdraw") {
    const isGiven = current === "approved" || current === "published";
    return isGiven ? "withdrawn" : null;
  }
  if (current !== "waiting") return null;
  if (move === "decline") return "declined";
  return "approved";
}

/** How an approval is given by the move; null for any other move. */
export function wayOf(move: SharingMove): SharingWay | null {
  if (move === "approve") return "online";
  if (move === "record_paper") return "paper";
  return null;
}

/**
 * Whether the move stops a sharing. A stop is kept even when the sharing
 * changed since the screen showed it, so stopping always wins.
 */
export function isStop(move: SharingMove): boolean {
  return (
    move === "cancel" || move === "withdraw" || move === "consent_withdrawn"
  );
}

/** The buttons Konselor sees for a sharing in this status. */
export function counsellorSharingMoves(
  current: Current,
): CounsellorSharingMove[] {
  return COUNSELLOR_MOVES.filter(
    (move) => sharingAfter(move, current) !== null,
  );
}

/** The buttons the student sees for their own sharing in this status. */
export function studentSharingMoves(current: Current): StudentSharingMove[] {
  return STUDENT_MOVES.filter((move) => sharingAfter(move, current) !== null);
}

/** What Konselor wrote down of a student that data can be shared from. */
export interface SharingBasis {
  hasSessions: boolean;
  hasScreening: boolean;
}

/**
 * "Data yang dibagikan" offered for a student, in the order of the form:
 * the level once screened, the counselling and the summary once a
 * session was written down.
 */
export function offeredData(basis: SharingBasis): SharedData[] {
  return SHARED_DATA.filter((data) =>
    data === "level" ? basis.hasScreening : basis.hasSessions,
  );
}

/** Why the data cannot be asked for, or null when each part is offered. */
export function missingBasis(
  data: readonly SharedData[],
  basis: SharingBasis,
): string | null {
  if (data.includes("level") && !basis.hasScreening) return NO_SCREENING;
  const offered = offeredData(basis);
  const isOffered = data.every((each) => offered.includes(each));
  return isOffered ? null : NO_SESSION;
}

/**
 * Whether a recipient may read a sharing: only once it is Dipublikasikan,
 * and only a recipient ticked on it. Ketua Program Studi and Pengasuh are
 * further kept to their own students where the data is read.
 */
export function recipientSees(
  sharing: { status: SharingStatus; recipients: readonly SharingRecipient[] },
  recipient: SharingRecipient,
): boolean {
  if (sharing.status !== "published") return false;
  return sharing.recipients.includes(recipient);
}
