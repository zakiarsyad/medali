import type { Parsed } from "@/parsed";

/*
 * Read by the cards in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the cards.
 */

/** The reason that needs a note of its own. */
export const OTHER_REASON = "Lainnya";

/** The reasons a photo is rejected for, in the order the card offers them. */
export const REJECTION_REASONS = [
  "Wajah tidak terlihat jelas",
  "Foto bukan dari kegiatan ini",
  "Tidak terlihat di lokasi kegiatan",
  "Foto tidak sesuai waktu kegiatan",
  OTHER_REASON,
];

export const OTHER_NOTE_MIN = 3;
export const OTHER_NOTE_MAX = 200;

export const NO_REASON = "Pilih alasan penolakan.";
export const NO_OTHER_NOTE = "Isi catatan untuk alasan Lainnya.";
export const OTHER_NOTE_LENGTH = `Catatan untuk alasan Lainnya ${OTHER_NOTE_MIN} sampai ${OTHER_NOTE_MAX} karakter.`;

function refusal(error: string): Parsed<string> {
  return { ok: false, error };
}

function isReason(reason: string): boolean {
  return REJECTION_REASONS.includes(reason);
}

/**
 * The reason of a rejection as it is kept, and as the student reads it
 * as Keterangan. Only a reason of the list is taken. "Lainnya" is kept
 * with its note; the note of any other reason is not asked for and not
 * kept. Both come from outside and are not trusted: a request made by
 * hand may send anything, and what is no text counts as not sent.
 */
export function rejectionNote(reason: unknown, note: unknown): Parsed<string> {
  const isListed = typeof reason === "string" && isReason(reason);
  if (!isListed) return refusal(NO_REASON);
  if (reason !== OTHER_REASON) return { ok: true, value: reason };
  const written = typeof note === "string" ? note.trim() : "";
  if (written === "") return refusal(NO_OTHER_NOTE);
  const isTooShort = written.length < OTHER_NOTE_MIN;
  const isTooLong = written.length > OTHER_NOTE_MAX;
  if (isTooShort || isTooLong) return refusal(OTHER_NOTE_LENGTH);
  return { ok: true, value: `${OTHER_REASON}: ${written}` };
}
