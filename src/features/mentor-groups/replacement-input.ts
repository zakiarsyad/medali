import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import {
  OLD_MENTOR_STATUSES,
  type OldMentorStatus,
  REPLACEMENT_REASONS,
  type ReplacementReason,
} from "@/mentoring/replacement-ids";
import type { Parsed } from "@/parsed";
import { NOTE_MAX_LENGTH, typedNote } from "./evaluation-input";
import { MENTOR_CHANGED } from "./replacement-refusals";

/** "Tetapkan penggantian" as the form sends it. */
export interface SentReplacement {
  groupId: string;
  oldMentorId: string;
  reason: string;
  startsOn: string;
  newMentorId: string;
  letterNumber: string;
  oldMentorStatus: string;
  note: string;
  /** What the tick box sends when it is ticked. */
  confirmed: string;
}

export interface ReplacementInput {
  groupId: string;
  /** The mentor the form showed as the one who is replaced. */
  oldMentorId: string;
  reason: ReplacementReason;
  /** "Tanggal efektif". */
  startsOn: string;
  newMentorId: string;
  letterNumber: string;
  oldMentorStatus: OldMentorStatus;
  /** Null for a replacement without a Keterangan. */
  note: string | null;
}

/** What the tick box sends when it is ticked. */
export const CONFIRMED = "yes";

export const LETTER_NUMBER_MAX = 100;

export const ASK_FOR_NEW_MENTOR = "Pilih pengasuh pengganti.";
export const ASK_FOR_TICK = "Centang konfirmasi terlebih dahulu.";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function reasonOf(sent: string): ReplacementReason | null {
  return REPLACEMENT_REASONS.find((reason) => reason === sent) ?? null;
}

function oldStatusOf(sent: string): OldMentorStatus | null {
  return OLD_MENTOR_STATUSES.find((status) => status === sent) ?? null;
}

function parseLetterNumber(sent: string): Parsed<string> {
  const letterNumber = sent.trim();
  if (letterNumber === "") {
    return refused("Isi nomor surat keputusan atau nota dinas.");
  }
  if (letterNumber.length > LETTER_NUMBER_MAX) {
    return refused(
      `Nomor surat keputusan atau nota dinas paling panjang ${LETTER_NUMBER_MAX} karakter.`,
    );
  }
  return { ok: true, value: letterNumber };
}

function parseNote(sent: string): Parsed<string | null> {
  const note = typedNote(sent);
  if (note.length > NOTE_MAX_LENGTH) {
    return refused(
      `Keterangan paling panjang ${NOTE_MAX_LENGTH.toLocaleString("id-ID")} karakter.`,
    );
  }
  return { ok: true, value: note === "" ? null : note };
}

/**
 * Checks "Tetapkan penggantian" as sent, and says what is missing: every
 * field but Keterangan must be there, and the tick box ticked. Whether
 * the day is today or later, and whether the old mentor still holds the
 * group, is for the save to say, which knows both.
 */
export function parseReplacement(
  sent: SentReplacement,
): Parsed<ReplacementInput> {
  if (!isUuid(sent.groupId)) return refused("Pilih kelompok pengasuhan.");
  if (!isUuid(sent.oldMentorId)) return MENTOR_CHANGED;
  const reason = reasonOf(sent.reason);
  if (reason === null) return refused("Pilih alasan penggantian.");
  if (!isDay(sent.startsOn)) {
    return refused("Isi tanggal efektif dengan tanggal yang benar.");
  }
  if (!isUuid(sent.newMentorId)) return refused(ASK_FOR_NEW_MENTOR);
  const letterNumber = parseLetterNumber(sent.letterNumber);
  if (!letterNumber.ok) return letterNumber;
  const oldMentorStatus = oldStatusOf(sent.oldMentorStatus);
  if (oldMentorStatus === null) return refused("Pilih status pengasuh lama.");
  const note = parseNote(sent.note);
  if (!note.ok) return note;
  if (sent.confirmed !== CONFIRMED) return refused(ASK_FOR_TICK);
  return {
    ok: true,
    value: {
      groupId: sent.groupId,
      oldMentorId: sent.oldMentorId,
      reason,
      startsOn: sent.startsOn,
      newMentorId: sent.newMentorId,
      letterNumber: letterNumber.value,
      oldMentorStatus,
      note: note.value,
    },
  };
}
