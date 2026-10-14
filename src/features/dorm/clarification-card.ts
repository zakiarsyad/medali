import type { ClarificationFile } from "@/clarifications/shown-file";
import { shownMoment } from "@/ui/day";
import type { AcceptedAs, DormClarificationStatus } from "./clarification-ids";
import { ACCEPTED_WORDS } from "./clarification-words";

/*
 * A clarification of a dorm absence as its card shows it to staff. Read
 * by the cards in the browser, so nothing here may take from the
 * database code.
 */

/** A check or a decision on a card: what it was, and who made it and when. */
export interface CheckWords {
  /** What it was, with its note when there is one. */
  result: string;
  /** Who and when, in brackets. */
  by: string;
}

export interface DormClarificationCard {
  id: string;
  /** When it was sent, written so that the newest sorts last. */
  sentAt: string;
  name: string;
  nim: string;
  /** Where the resident lives today, such as Asrama Dana Rakca, kamar 101. */
  room: string;
  activity: string;
  /** The day of the activity and its hours. */
  held: string;
  reason: string;
  explanation: string;
  status: DormClarificationStatus;
  /** Whether a file of it is kept here. */
  hasFile: boolean;
  /**
   * The file, for an account that may open it, while one is kept. Null
   * for the roles that only read: they are told only that there is one.
   */
  file: ClarificationFile | null;
  /** The time it was sent, as the card says it. */
  sent: string;
  /** The check of BAM, or null before it. */
  verification: CheckWords | null;
  /** The last word of Pengelola Asrama or of a closing, or null before it. */
  decision: CheckWords | null;
}

function withNote(words: string, note: string): string {
  return note === "" ? words : `${words}: ${note}`;
}

/**
 * What BAM made of a clarification it checked: passed on, unless it is
 * rejected with no decision after the check, which is BAM's rejection.
 */
export function verificationWords(
  status: DormClarificationStatus,
  isDecided: boolean,
  note: string,
): string {
  const rejectedByBam = status === "rejected" && !isDecided;
  return withNote(rejectedByBam ? "Ditolak BAM" : "Diterima BAM", note);
}

/** What the last word on a clarification was, with its note. */
export function decisionWords(
  status: DormClarificationStatus,
  acceptedAs: AcceptedAs | null,
  note: string,
): string {
  if (acceptedAs !== null) return withNote(ACCEPTED_WORDS[acceptedAs], note);
  if (status === "closed") return withNote("Ditutup", note);
  return withNote("Ditolak", note);
}

export function byWords(name: string, at: Date): string {
  return `(${name}, ${shownMoment(at)})`;
}

/** What the Lampiran of a card says to a role that may not open the file. */
export function fileNotOpenedWords(hasFile: boolean): string {
  return hasFile ? "Terlampir" : "-";
}
