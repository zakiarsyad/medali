import type { ClarificationFile } from "@/clarifications/shown-file";
import { shownMoment } from "@/ui/day";
import type { ClarificationStatus } from "./clarification-reasons";
import { shownDays, shownHours } from "./schedule-words";

/*
 * Read by the cards in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the cards.
 */

/** What a decided clarification says under "Keputusan". */
export interface DecisionWords {
  /** How it was decided, with the note when there is one. */
  result: string;
  /** Who decided and when, in brackets. */
  by: string;
}

/**
 * A clarification as every role that reads it sees it, every line in
 * words already: the server writes the times, so each browser shows the
 * same. It holds no explanation and nothing of the file.
 */
export interface ClarificationSummary {
  id: string;
  /** When it was sent, written so that the newest sorts last. */
  sentAt: string;
  name: string;
  nim: string;
  program: string;
  activity: string;
  /** The day or days of the schedule and its hours. */
  held: string;
  reason: string;
  status: ClarificationStatus;
  /** The time it was sent, as the card says it. */
  sent: string;
  /** Null while it waits. */
  decision: DecisionWords | null;
}

/** A clarification as its card shows it to the account that decides it. */
export interface ClarificationCard extends ClarificationSummary {
  explanation: string;
  /** Null when no file is kept for it here. */
  file: ClarificationFile | null;
}

export const CLARIFICATION_STATUS_WORDS: Record<ClarificationStatus, string> = {
  submitted: "Diajukan",
  accepted: "Diterima",
  rejected: "Ditolak",
};

export const NO_FILE = "-";

const RESULT_WORDS = {
  valid: "Diterima sebagai hadir",
  dispensation: "Diterima sebagai dispensasi",
  rejected: "Ditolak",
} as const;

/** How a clarification was decided, as the screens say it. */
export type ClarificationResult = keyof typeof RESULT_WORDS;

/** How it was decided, then the note of the decision when one was written. */
export function resultWords(result: ClarificationResult, note: string): string {
  const words = RESULT_WORDS[result];
  return note === "" ? words : `${words}: ${note}`;
}

export function decidedByWords(name: string, at: Date): string {
  return `(${name}, ${shownMoment(at)})`;
}

/** When a schedule is held, such as 13 Okt 2026, 07:30–11:30. */
export function heldWords(schedule: {
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
}): string {
  const days = shownDays(schedule.startsOn, schedule.endsOn);
  return `${days}, ${shownHours(schedule.startTime, schedule.endTime)}`;
}

/**
 * Where the file of a clarification is asked from the server: to be
 * shown inside the page, or to be downloaded.
 */
export function fileAddressOf(clarificationId: string, isShown: boolean) {
  const address = `/kegiatan/klarifikasi/lampiran/${clarificationId}`;
  return isShown ? `${address}?lihat=1` : address;
}

/** Whether a clarification comes with what only the deciding account reads. */
export function hasDetails(
  card: ClarificationSummary | ClarificationCard,
): card is ClarificationCard {
  return "explanation" in card;
}
