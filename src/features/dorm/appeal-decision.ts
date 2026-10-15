import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import { APPEAL_NOTE_MAX_LENGTH } from "./appeal-ids";

/*
 * The rules of a decision on an appeal of a dorm violation, apart from
 * the database and from how its buttons are drawn. Read by the cards in
 * the browser: nothing here may take from the database code.
 */

export const DECISION_KINDS = ["accept", "reject"] as const;

export type AppealDecisionKind = (typeof DECISION_KINDS)[number];

export const NOTE_NEEDED = "Isi catatan alasan penolakan.";
export const NOTE_TOO_LONG = `Catatan BAM paling banyak ${APPEAL_NOTE_MAX_LENGTH} karakter.`;
export const UNKNOWN_DECISION = "Putusan tidak dikenal. Muat ulang halaman.";

/** What "Terima" and "Tolak" say once the decision is kept. */
export const DECIDED_WORDS: Record<AppealDecisionKind, string> = {
  accept: "Advokasi diterima. Pelanggaran tidak dihitung.",
  reject: "Advokasi ditolak. Pelanggaran naik ke Pengelola Asrama.",
};

/** A checked decision, with Catatan BAM as it is kept. */
export interface AppealDecision {
  kind: AppealDecisionKind;
  note: string;
}

/** The database keeps no text with this character; only a hand-made request sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * The decision a press and "Catatan BAM" make. Nothing sent is trusted:
 * a note that is no text counts as not written. "Terima" may have a
 * note; "Tolak" needs one.
 */
export function parseAppealDecision(
  kind: unknown,
  note: unknown,
): Parsed<AppealDecision> {
  const typed = typeof note === "string" ? note : "";
  const kept = typed.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  if (kind !== "accept" && kind !== "reject") return refused(UNKNOWN_DECISION);
  if (kind === "reject" && kept === "") return refused(NOTE_NEEDED);
  if (lettersIn(kept) > APPEAL_NOTE_MAX_LENGTH) return refused(NOTE_TOO_LONG);
  return { ok: true, value: { kind, note: kept } };
}
