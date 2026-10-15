import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import {
  CLEANING_NOTE_MAX_LENGTH,
  CLEANING_RESULTS,
  type CleaningResult,
  type CleaningStatus,
} from "./cleaning-ids";
import {
  CLEANING_NOTE_TOO_LONG,
  JUDGE_NOTE_NEEDED,
  RESULT_UNKNOWN,
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
 * never judged.
 */
export function offersOf(
  duty: DutyStanding,
  day: string,
  today: string,
  rights: DutyRights,
): DutyOffers {
  const isDue = day <= today;
  return {
    judge: rights.judge && duty.status === "scheduled" && isDue,
    validate: rights.validate && duty.status === "judged",
    cancel: rights.manage && day >= today && isNeverJudged(duty),
  };
}
