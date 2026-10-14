import type { Parsed } from "@/parsed";
import { firstLetters, lettersIn } from "@/ui/letters-in";
import { DECISION_NOTE_MAX_LENGTH } from "./request-ids";
import { ENTRY_NOTE_MAX_LENGTH, POINTS_MAX, POINTS_MIN } from "./siku-ids";

/*
 * The rules of a decision on a request for a SIKU gain, apart from the
 * database and from how its buttons are drawn. Read by the cards in the
 * browser: nothing here may take from the database code.
 */

export const DECISION_KINDS = ["approve", "reject"] as const;

export type DecisionKind = (typeof DECISION_KINDS)[number];

export const POINTS_OUTSIDE = `Poin harus ${POINTS_MIN}–${POINTS_MAX}.`;
export const NOTE_NEEDED = "Isi catatan alasan penolakan.";
export const NOTE_TOO_LONG = `Catatan penilai paling banyak ${DECISION_NOTE_MAX_LENGTH} karakter.`;
export const UNKNOWN_DECISION = "Putusan tidak dikenal. Muat ulang halaman.";
export const REQUEST_REJECTED = "Pengajuan ditolak.";

/** A checked decision: the points of an approval, and the note as kept. */
export type RequestDecision =
  | { kind: "approve"; points: number; note: string }
  | { kind: "reject"; note: string };

/** The database keeps no text with this character; only a hand-made request sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

const WHOLE = /^\d{1,3}$/;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function pointsOf(sent: unknown): number | null {
  if (typeof sent !== "string" || !WHOLE.test(sent.trim())) return null;
  const points = Number(sent.trim());
  if (points < POINTS_MIN || points > POINTS_MAX) return null;
  return points;
}

/**
 * The decision a press, Poin and "Catatan penilai" make. Nothing sent is
 * trusted: a note that is no text counts as not written. An approval
 * needs whole points from 1 to 30 and may have a note; a rejection needs
 * its note.
 */
export function parseDecision(
  kind: unknown,
  points: unknown,
  note: unknown,
): Parsed<RequestDecision> {
  const typed = typeof note === "string" ? note : "";
  const kept = typed.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  if (kind === "reject") {
    if (kept === "") return refused(NOTE_NEEDED);
    const isTooLong = lettersIn(kept) > DECISION_NOTE_MAX_LENGTH;
    if (isTooLong) return refused(NOTE_TOO_LONG);
    return { ok: true, value: { kind, note: kept } };
  }
  if (kind !== "approve") return refused(UNKNOWN_DECISION);
  const whole = pointsOf(points);
  if (whole === null) return refused(POINTS_OUTSIDE);
  if (lettersIn(kept) > DECISION_NOTE_MAX_LENGTH) return refused(NOTE_TOO_LONG);
  return { ok: true, value: { kind, points: whole, note: kept } };
}

/** What "Setujui" says once the gain is kept. */
export function approvedWords(points: number, name: string): string {
  return `Disetujui: +${points} SIKU untuk ${name}.`;
}

const CUT = "…";

/**
 * The Keterangan of the gain an approval makes: the report of the
 * request, cut to what an entry holds, which is less than a report may,
 * counted as the database counts letters.
 */
export function entryNoteOf(report: string): string {
  if (lettersIn(report) <= ENTRY_NOTE_MAX_LENGTH) return report;
  return `${firstLetters(report, ENTRY_NOTE_MAX_LENGTH - lettersIn(CUT))}${CUT}`;
}
