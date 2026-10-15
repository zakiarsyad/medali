/*
 * The fixed values of Pelanggaran asrama. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** Jenis hukuman: Penindakan langsung, Teguran, TKS or Hukuman lainnya. */
export const PUNISHMENTS = [
  "direct_action",
  "warning",
  "tks",
  "other",
] as const;

export type Punishment = (typeof PUNISHMENTS)[number];

/**
 * What a line of the log of a violation records: its entry, its cancel,
 * the appeal of its resident and the decision on that appeal, and its
 * reduction by Pengelola Asrama and the undoing of that.
 */
export const VIOLATION_CHANGE_ACTIONS = [
  "entered",
  "cancelled",
  "appealed",
  "appeal_accepted",
  "appeal_rejected",
  "reduced",
  "reduction_undone",
] as const;

/**
 * How long "Dasar pengurangan (hasil klarifikasi yang diterima)" is,
 * without spaces around it. The least is the prototype's value.
 */
export const REDUCTION_REASON_MIN_LENGTH = 5;
export const REDUCTION_REASON_MAX_LENGTH = 500;

/** The reasons the form offers; any other reason may be typed. */
export const VIOLATION_REASONS = [
  "Terlambat apel pagi",
  "Tidak mengikuti kegiatan asrama tanpa keterangan",
  "Kamar tidak rapi saat pemeriksaan",
  "Keluar asrama tanpa izin",
  "Terlambat kembali dari izin",
  "Membuat kegaduhan pada jam istirahat",
  "Tidak berpakaian sesuai ketentuan",
  "Tidak melaksanakan jadwal piket kebersihan",
] as const;

/** How long Alasan pelanggaran is, without spaces around it. */
export const REASON_MIN_LENGTH = 3;
export const REASON_MAX_LENGTH = 200;

/** The most letters "Hukuman lainnya" holds. */
export const OTHER_PUNISHMENT_MAX_LENGTH = 100;

/** The most violations one press of "Simpan dan jadwalkan publikasi" keeps. */
export const VIOLATIONS_PER_SAVE_MAX = 50;

/**
 * How long a resident may appeal after the announcement, after which the
 * violation goes up to Pengelola Asrama. The prototype's value, to be
 * confirmed by the campus.
 */
export const APPEAL_HOURS = 3;

/** The hour the form offers for the announcement, as in the prototype. */
export const ANNOUNCEMENT_TIME = "21:00";

/** How many rows one page of each list of the tab shows. */
export const VIOLATIONS_PAGE_SIZE = 20;
