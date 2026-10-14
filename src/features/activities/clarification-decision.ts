import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { ATTENDANCE_WORDS, type AttendanceStatus } from "./attendance-status";
import { answerOr, DECISION_NOT_SENT } from "./card-decisions";
import type { ClarificationCard } from "./clarification-card";

/*
 * The rules of a decision on a clarification, apart from the database
 * and from how its buttons are drawn, so they can be checked alone. Read
 * by the cards in the browser: nothing here may take from the database
 * code.
 */

/** What Penilai Mahasiswa decides: present, a dispensation, or rejected. */
export const DECISION_KINDS = ["present", "dispensation", "reject"] as const;

export type DecisionKind = (typeof DECISION_KINDS)[number];

export const DECISION_KIND_WORDS: Record<DecisionKind, string> = {
  present: "Terima sebagai hadir",
  dispensation: "Terima sebagai dispensasi",
  reject: "Tolak",
};

export const DECISION_NOTE_MAX = 200;

export const DECIDE_NOT_ALLOWED = "Anda tidak berhak memutuskan klarifikasi.";
export const CLARIFICATION_NOT_FOUND =
  "Klarifikasi ini tidak ditemukan. Muat ulang halaman.";
export const CLARIFICATION_DECIDED_BY_OTHER =
  "Klarifikasi ini sudah diputuskan oleh petugas lain.";
export const UNKNOWN_DECISION = "Putusan tidak dikenal. Muat ulang halaman.";
export const REJECTION_NOTE_MISSING =
  "Tulis alasan penolakan di kolom catatan.";
export const DECISION_NOTE_TOO_LONG = `Catatan paling banyak ${DECISION_NOTE_MAX} karakter.`;
export const CLARIFICATION_ACCEPTED =
  "Klarifikasi diterima; status kehadiran diperbarui.";
export const CLARIFICATION_REJECTED = "Klarifikasi ditolak.";

/** A decision that was checked: how, and the note as it is kept. */
export interface ClarificationDecision {
  kind: DecisionKind;
  /** Empty when nothing was noted. */
  note: string;
}

/**
 * What a decision on a card answers: the words to show, and the card as
 * it stands now, or null when the answer has no card to give.
 */
export interface ClarificationAnswer {
  state: FormState;
  card: ClarificationCard | null;
}

/** The database keeps no text with this character; only a hand-made request sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

function isKind(kind: unknown): kind is DecisionKind {
  return DECISION_KINDS.some((each) => each === kind);
}

/**
 * The decision a press and a Catatan make. Nothing sent is trusted: a
 * note that is no text counts as not written. A rejection needs its
 * note; an acceptance keeps one when it is written.
 */
export function parseDecision(
  kind: unknown,
  note: unknown,
): Parsed<ClarificationDecision> {
  if (!isKind(kind)) return { ok: false, error: UNKNOWN_DECISION };
  const typed = typeof note === "string" ? note : "";
  const kept = typed.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  if (kept.length > DECISION_NOTE_MAX) {
    return { ok: false, error: DECISION_NOTE_TOO_LONG };
  }
  if (kind === "reject" && kept === "") {
    return { ok: false, error: REJECTION_NOTE_MISSING };
  }
  return { ok: true, value: { kind, note: kept } };
}

function refusedWith(error: string): ClarificationAnswer {
  return { state: { error, done: null }, card: null };
}

/**
 * What a press of a decision answers. A decision the server would
 * refuse for its note is answered at once and sent nowhere. One that did
 * not arrive is an answer too: the card stays as it is and says to try
 * again. `rethrow` throws again what is no failure, as an answer that
 * leads elsewhere.
 */
export function answerToPress(
  kind: DecisionKind,
  note: string,
  send: (kind: DecisionKind, note: string) => Promise<ClarificationAnswer>,
  rethrow: (error: unknown) => void,
): Promise<ClarificationAnswer> {
  const decision = parseDecision(kind, note);
  if (!decision.ok) return Promise.resolve(refusedWith(decision.error));
  return answerOr(
    () => send(kind, note),
    rethrow,
    refusedWith(DECISION_NOT_SENT),
  );
}

export function doneWords(kind: DecisionKind): string {
  return kind === "reject" ? CLARIFICATION_REJECTED : CLARIFICATION_ACCEPTED;
}

/**
 * Said when a clarification cannot be accepted because the student's
 * attendance already counts, as after a record made by hand.
 */
export function alreadyAttendedWords(status: AttendanceStatus): string {
  return `Kehadiran mahasiswa ini sudah berstatus ${ATTENDANCE_WORDS[status]} pada kegiatan ini, sehingga klarifikasi tidak dapat diterima. Tolak dengan catatan bila perlu.`;
}
