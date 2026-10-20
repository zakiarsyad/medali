/*
 * The fixed values of Catatan pelanggaran. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** Jenis hukuman: Pembinaan langsung, Teguran or Hukuman lainnya. */
export const NOTE_PUNISHMENTS = [
  "direct_guidance",
  "warning",
  "other",
] as const;

export type NotePunishment = (typeof NOTE_PUNISHMENTS)[number];

/** What a line of the log of a note records: its save and its removal. */
export const NOTE_CHANGE_ACTIONS = ["added", "removed"] as const;

/**
 * Kategori: the first note of a student in a semester, or one after it.
 * Worked out from the notes, never stored.
 */
export const NOTE_CATEGORIES = ["first", "further"] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

/** How long Uraian pelanggaran is, without spaces around it. The least is the prototype's. */
export const DESCRIPTION_MIN_LENGTH = 5;
export const DESCRIPTION_MAX_LENGTH = 300;

/** The most letters "Hukuman lainnya" holds. */
export const OTHER_PUNISHMENT_MAX_LENGTH = 100;

/** The most letters Keterangan holds. */
export const REMARK_MAX_LENGTH = 500;

/** The ready examples of Uraian pelanggaran, from the prototype; any other may be typed. */
export const DESCRIPTION_EXAMPLES = [
  "Terlambat mengikuti apel pagi",
  "Tidak memakai atribut lengkap saat kegiatan resmi",
  "Membuat kegaduhan di ruang belajar",
  "Tidak mengikuti piket kebersihan kamar",
  "Meninggalkan kegiatan sebelum selesai tanpa izin",
] as const;

/** How many notes one page of the list shows. */
export const NOTES_PAGE_SIZE = 25;
