import type { Parsed } from "@/parsed";
import {
  CONTACT_MAX_LENGTH,
  DESTINATION_MAX_LENGTH,
  LEAVE_KINDS,
  type LeaveKind,
  PURPOSE_MAX_LENGTH,
  PURPOSE_MIN_LENGTH,
  SPECIAL_REASONS,
  type SpecialReason,
} from "./leave-ids";
import { timeProblems } from "./leave-rules";
import { momentOf } from "./leave-time";

/** A leave request as the form sends it, every field as text. */
export interface SentLeave {
  kind: string;
  startsAt: string;
  endsAt: string;
  specialReason: string;
  purpose: string;
  destination: string;
  contact: string;
}

/** A checked leave request. */
export interface LeaveInput {
  kind: LeaveKind;
  start: Date;
  end: Date;
  /** Jenis keperluan, only of Izin khusus. */
  specialReason: SpecialReason | null;
  purpose: string;
  /** Tujuan and Kontak; empty for ITMK. */
  destination: string;
  contact: string;
}

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export const NO_KIND = "Pilih jenis izin.";
export const NO_SPECIAL_REASON = "Pilih jenis keperluan.";
export const PURPOSE_TOO_SHORT = `Jelaskan keperluan izin, minimal ${PURPOSE_MIN_LENGTH} huruf.`;

export function noTimesWords(kind: LeaveKind): string {
  return kind === "skip_activities"
    ? "Isi tanggal dan jam pada Dari dan Sampai."
    : "Isi tanggal dan jam pada Berangkat dan Kembali.";
}

function kindOf(sent: string): LeaveKind | null {
  return LEAVE_KINDS.find((kind) => kind === sent) ?? null;
}

function specialReasonOf(sent: string): SpecialReason | null {
  return SPECIAL_REASONS.find((reason) => reason === sent) ?? null;
}

/**
 * How many letters a text holds, as the database counts them: an emoji
 * is one, where the length of a text would count two.
 */
export function lettersIn(text: string): number {
  return [...text].length;
}

function tooLong(words: string, max: number): string {
  return `${words} paling banyak ${max} huruf.`;
}

/** Tujuan and Kontak, checked; ITMK keeps none. */
function placeOf(
  kind: LeaveKind,
  sent: SentLeave,
): Parsed<{ destination: string; contact: string }> {
  if (kind === "skip_activities") {
    return { ok: true, value: { destination: "", contact: "" } };
  }
  const destination = sent.destination.trim();
  const contact = sent.contact.trim();
  if (lettersIn(destination) > DESTINATION_MAX_LENGTH) {
    return refused(tooLong("Tujuan", DESTINATION_MAX_LENGTH));
  }
  if (lettersIn(contact) > CONTACT_MAX_LENGTH) {
    return refused(tooLong("Kontak", CONTACT_MAX_LENGTH));
  }
  return { ok: true, value: { destination, contact } };
}

/**
 * Checks a leave request sent at a moment. The times are in campus time;
 * what is wrong with them is said all at once. Jenis keperluan is read
 * only for Izin khusus, and Tujuan and Kontak not for ITMK. Keperluan
 * holds 5 to 500 letters, not counting spaces around it.
 */
export function parseLeave(sent: SentLeave, now: Date): Parsed<LeaveInput> {
  const kind = kindOf(sent.kind);
  if (kind === null) return refused(NO_KIND);
  const start = momentOf(sent.startsAt);
  const end = momentOf(sent.endsAt);
  if (start === null || end === null) return refused(noTimesWords(kind));
  const problems = timeProblems({ kind, start, end }, now);
  if (problems.length > 0) return refused(problems.join(" "));

  const specialReason =
    kind === "special" ? specialReasonOf(sent.specialReason) : null;
  if (kind === "special" && specialReason === null) {
    return refused(NO_SPECIAL_REASON);
  }
  const purpose = sent.purpose.trim();
  const letters = lettersIn(purpose);
  if (letters < PURPOSE_MIN_LENGTH) return refused(PURPOSE_TOO_SHORT);
  if (letters > PURPOSE_MAX_LENGTH) {
    return refused(tooLong("Keperluan", PURPOSE_MAX_LENGTH));
  }
  const place = placeOf(kind, sent);
  if (!place.ok) return place;
  return {
    ok: true,
    value: { kind, start, end, specialReason, purpose, ...place.value },
  };
}
