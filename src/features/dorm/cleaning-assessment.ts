import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import {
  CLEANING_NOTE_MAX_LENGTH,
  CLEANING_RESULTS,
  type CleaningResult,
  type CleaningStatus,
  SEND_BACK_MIN_LETTERS,
} from "./cleaning-ids";
import {
  CLEANING_NOTE_TOO_LONG,
  JUDGE_NOTE_NEEDED,
  RESULT_UNKNOWN,
  SEND_BACK_REASON_NEEDED,
  SEND_BACK_REASON_TOO_LONG,
} from "./cleaning-messages";

/*
 * The rules of judging and validating a cleaning duty, apart from the
 * database and from how its buttons are drawn. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** Where a duty stands, as the screen says it. */
export const STATUS_WORDS: Record<CleaningStatus, string> = {
  scheduled: "Terjadwal",
  judged: "Dinilai BAM",
  validated: "Divalidasi",
};

/** What BAM judged a duty, as the screen says it. */
export const RESULT_WORDS: Record<CleaningResult, string> = {
  met: "Memenuhi",
  not_met: "Tidak memenuhi",
};

/** What a validated result gives its room. */
export const RESULT_POINTS: Record<CleaningResult, number> = {
  met: 1,
  not_met: -1,
};

/** A room's Skor: its + minus its −. */
export function scoreOf(plus: number, minus: number): number {
  return plus * RESULT_POINTS.met + minus * RESULT_POINTS.not_met;
}

/** A score as the screen says it, such as +3, 0 or −2, with a true minus sign. */
export function scoreWords(score: number): string {
  const amount = Math.abs(score).toLocaleString("id-ID");
  if (score > 0) return `+${amount}`;
  if (score < 0) return `−${amount}`;
  return amount;
}

/** The No of a row of the ranking: its place among all, not only on its page. */
export function rankNumber(
  page: number,
  pageSize: number,
  index: number,
): number {
  return (page - 1) * pageSize + index + 1;
}

/** A validated result as a resident sees it, such as Memenuhi (+1). */
export function resultWithPoints(result: CleaningResult): string {
  return `${RESULT_WORDS[result]} (${scoreWords(RESULT_POINTS[result])})`;
}

/** The result of a duty a resident may see, with its note. */
export interface ShownResult {
  result: CleaningResult;
  note: string;
}

/**
 * What a resident sees of a duty's judgement: nothing until Pengelola
 * Asrama has validated it, as a judgement may still be sent back.
 */
export function shownResult(duty: {
  status: CleaningStatus;
  result: CleaningResult | null;
  judgeNote: string;
}): ShownResult | null {
  if (duty.status !== "validated" || duty.result === null) return null;
  return { result: duty.result, note: duty.judgeNote };
}

/** A judgement sent, checked. */
export interface Judgement {
  result: CleaningResult;
  note: string;
}

/** What of a duty decides what may be done with it. */
export interface DutyStanding {
  status: CleaningStatus;
  /** The reason of the last judgement sent back, empty when none was. */
  sentBackReason: string;
}

/** What an account may do with cleaning duties. */
export interface DutyRights {
  judge: boolean;
  validate: boolean;
  /** Give and cancel duties. */
  manage: boolean;
}

/** What a duty offers an account on the schedule. */
export interface DutyOffers {
  judge: boolean;
  validate: boolean;
  cancel: boolean;
  /** Whether the line that someone else decides it stands in place of judging and cancelling. */
  ownLine: boolean;
}

function isResult(sent: unknown): sent is CleaningResult {
  return CLEANING_RESULTS.some((result) => result === sent);
}

/** The note sent with a judgement or a sending back, without spaces around it. */
export function trimmedNote(sent: unknown): string {
  return typeof sent === "string" ? sent.trim() : "";
}

/**
 * Memenuhi or Tidak memenuhi with its Catatan, as sent from outside:
 * Tidak memenuhi needs a note on what is not clean.
 */
export function parseJudgement(
  result: unknown,
  note: unknown,
): Parsed<Judgement> {
  if (!isResult(result)) return RESULT_UNKNOWN;
  const trimmed = trimmedNote(note);
  if (lettersIn(trimmed) > CLEANING_NOTE_MAX_LENGTH) {
    return CLEANING_NOTE_TOO_LONG;
  }
  if (result === "not_met" && trimmed === "") return JUDGE_NOTE_NEEDED;
  return { ok: true, value: { result, note: trimmed } };
}

/**
 * The reason for "Tolak penilaian", as sent from outside: at least 5
 * letters, without the spaces around it.
 */
export function parseSendBackReason(reason: unknown): Parsed<string> {
  const trimmed = trimmedNote(reason);
  const letters = lettersIn(trimmed);
  if (letters < SEND_BACK_MIN_LETTERS) return SEND_BACK_REASON_NEEDED;
  if (letters > CLEANING_NOTE_MAX_LENGTH) return SEND_BACK_REASON_TOO_LONG;
  return { ok: true, value: trimmed };
}

/**
 * Whether a duty was never judged: one that went back to Terjadwal after
 * a judgement was sent back has been.
 */
export function isNeverJudged(duty: DutyStanding): boolean {
  return duty.status === "scheduled" && duty.sentBackReason === "";
}

/**
 * What a duty of `day` offers on `today`, the day on campus: judging a
 * duty that is Terjadwal, from its date on; validating or sending back
 * one that is Dinilai BAM; and cancelling one of today or later that was
 * never judged. A duty of the room the account's own student lives in is
 * neither judged nor cancelled by them.
 */
export function offersOf(
  duty: DutyStanding,
  day: string,
  today: string,
  rights: DutyRights,
  isOwnRoom = false,
): DutyOffers {
  const isDue = day <= today;
  const judges = rights.judge && duty.status === "scheduled" && isDue;
  const cancels = rights.manage && day >= today && isNeverJudged(duty);
  return {
    judge: judges && !isOwnRoom,
    validate: rights.validate && duty.status === "judged",
    cancel: cancels && !isOwnRoom,
    ownLine: isOwnRoom && (judges || cancels),
  };
}
