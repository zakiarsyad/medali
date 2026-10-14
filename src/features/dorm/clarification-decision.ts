import type { Parsed } from "@/parsed";
import {
  type AcceptedAs,
  CLARIFICATION_NOTE_MAX_LENGTH,
  type DormClarificationStatus,
} from "./clarification-ids";

/*
 * The rules of a check or a decision on a dorm clarification, apart from
 * the database and from how its buttons are drawn. Read by the cards in
 * the browser: nothing here may take from the database code.
 */

/** Whose step this is: BAM's check, or the decision of Pengelola Asrama. */
export type ClarificationStep = "verify" | "decide";

/** What BAM does with one that waits: pass it on, or reject it. */
export type VerifyKind = "pass" | "reject";

/** What Pengelola Asrama does with one BAM passed on. */
export type DecideKind = AcceptedAs | "reject";

export type CheckKind = VerifyKind | DecideKind;

export const STEP_KINDS: Record<ClarificationStep, readonly CheckKind[]> = {
  verify: ["pass", "reject"],
  decide: ["present", "leave", "reject"],
};

export const KIND_WORDS: Record<ClarificationStep, Record<string, string>> = {
  verify: {
    pass: "Terima, teruskan ke pengelola",
    reject: "Tolak klarifikasi",
  },
  decide: {
    present: "Terima sebagai hadir",
    leave: "Terima sebagai izin",
    reject: "Tolak",
  },
};

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const VERIFY_NOT_ALLOWED = refusal(
  "Anda tidak berhak memverifikasi klarifikasi.",
);
export const DECIDE_NOT_ALLOWED = refusal(
  "Anda tidak berhak memutuskan klarifikasi.",
);
export const CLARIFICATION_NOT_FOUND = refusal(
  "Klarifikasi ini tidak ditemukan. Muat ulang halaman.",
);
export const DECIDED_FIRST = refusal(
  "Klarifikasi ini sudah diputuskan oleh petugas lain. Muat ulang halaman.",
);
export const STILL_WAITS_FOR_BAM = refusal(
  "Klarifikasi ini masih menunggu verifikasi Badan Asrama Mahasiswa.",
);
export const UNKNOWN_DECISION = refusal(
  "Putusan tidak dikenal. Muat ulang halaman.",
);
export const REJECTION_NEEDS_NOTE = refusal(
  "Tulis alasan penolakan di kolom catatan.",
);
export const NOTE_TOO_LONG = refusal(
  `Catatan paling banyak ${CLARIFICATION_NOTE_MAX_LENGTH} karakter.`,
);

/** Said when a decision did not reach the server, or no answer came back. */
export const DECISION_NOT_SENT =
  "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

export const PASSED_ON =
  "Klarifikasi diterima dan diteruskan ke Pengelola Asrama.";
export const ACCEPTED = "Klarifikasi diterima; status kehadiran diperbarui.";
export const REJECTED = "Klarifikasi ditolak.";

/** What a kept check or decision says. */
export function doneWords(kind: string): string {
  if (kind === "reject") return REJECTED;
  if (kind === "pass") return PASSED_ON;
  return ACCEPTED;
}

/** Where a clarification stands after a step that was kept. */
export function statusAfterStep(
  step: ClarificationStep,
  kind: CheckKind,
): DormClarificationStatus {
  if (kind === "reject") return "rejected";
  return step === "verify" ? "verified" : "accepted";
}

/** A check or decision that was checked: how, and the note as it is kept. */
export interface CheckedDecision {
  kind: CheckKind;
  /** Empty when nothing was noted. */
  note: string;
}

/** The database keeps no text with this character; only a hand-made request sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

/**
 * The check or decision a press and a Catatan make, for one step.
 * Nothing sent is trusted: a kind of another step is unknown, and a note
 * that is no text counts as not written. A rejection needs its note; any
 * other keeps one when it is written.
 */
export function parseDecision(
  step: ClarificationStep,
  kind: unknown,
  note: unknown,
): Parsed<CheckedDecision> {
  const known = STEP_KINDS[step].find((each) => each === kind);
  if (known === undefined) return UNKNOWN_DECISION;
  const typed = typeof note === "string" ? note : "";
  const kept = typed.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  if ([...kept].length > CLARIFICATION_NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  if (known === "reject" && kept === "") return REJECTION_NEEDS_NOTE;
  return { ok: true, value: { kind: known, note: kept } };
}
