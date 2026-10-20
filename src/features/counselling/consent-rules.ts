import type { ConsentStatus, ConsentWay } from "./consent-ids";

/**
 * What Konselor or the student does to a consent. The student also gives
 * it by ticking it when registering for voluntary counselling.
 */
export type ConsentMove =
  | "ask"
  | "record_paper"
  | "approve"
  | "decline"
  | "withdraw"
  | "register";

export type CounsellorMove = Extract<ConsentMove, "ask" | "record_paper">;

export type StudentMove = Extract<
  ConsentMove,
  "approve" | "decline" | "withdraw"
>;

export const COUNSELLOR_MOVES: readonly CounsellorMove[] = [
  "ask",
  "record_paper",
];

export const STUDENT_MOVES: readonly StudentMove[] = [
  "approve",
  "decline",
  "withdraw",
];

/** A consent's status, with how a Disetujui was given. */
export interface ConsentState {
  status: ConsentStatus;
  way: ConsentWay | null;
}

/** Null for a student who was never asked: Belum diminta. */
type Current = ConsentStatus | null;

function mayAsk(current: Current): boolean {
  return current === null || current === "declined" || current === "withdrawn";
}

/**
 * What a consent becomes after a move, or null when the move is not
 * allowed from its status. A request waits until the student answers,
 * so it is never sent twice, but a signed paper form may be recorded
 * while one waits.
 */
export function consentAfter(
  move: ConsentMove,
  current: Current,
): ConsentState | null {
  if (move === "ask") {
    return mayAsk(current) ? { status: "waiting", way: null } : null;
  }
  if (move === "record_paper") {
    return current === "approved" ? null : { status: "approved", way: "paper" };
  }
  if (move === "register") {
    if (current === "approved") return null;
    return { status: "approved", way: "registration" };
  }
  if (move === "withdraw") {
    return current === "approved" ? { status: "withdrawn", way: null } : null;
  }
  if (current !== "waiting") return null;
  if (move === "approve") return { status: "approved", way: "online" };
  return { status: "declined", way: null };
}

/** The buttons Konselor sees for a consent in this status. */
export function counsellorMoves(current: Current): CounsellorMove[] {
  return COUNSELLOR_MOVES.filter(
    (move) => consentAfter(move, current) !== null,
  );
}

/** The buttons the student sees for their own consent in this status. */
export function studentMoves(current: Current): StudentMove[] {
  return STUDENT_MOVES.filter((move) => consentAfter(move, current) !== null);
}
