/*
 * The fixed facts of SKPM data. Read by the screen parts in the browser
 * and by the table definitions, so nothing here may take from the
 * database code.
 */

/** "Tambahkan" adds to what is there; "Ganti semua data" takes its place. */
export const SKPM_UPLOAD_MODES = ["add", "replace"] as const;

export type SkpmUploadMode = (typeof SKPM_UPLOAD_MODES)[number];

/** What the log of SKPM uploads records. */
export const SKPM_UPLOAD_ACTIONS = ["uploaded", "removed"] as const;

/** The fewest and the most points one activity row may give. */
export const ROW_POINTS_MIN = 0;
export const ROW_POINTS_MAX = 1000;

/** The range of "Poin untuk nilai 100", and where it starts. */
export const POINTS_FOR_100_MIN = 1;
export const POINTS_FOR_100_MAX = 1000;
export const STARTING_POINTS_FOR_100 = 50;

/**
 * The kategori and the tingkat of the SKPM guidelines, as the prototype
 * lists them. A file may say another: its text is kept.
 */
export const SKPM_CATEGORIES = [
  "Organisasi kemahasiswaan",
  "Kepanitiaan",
  "Lomba atau kompetisi",
  "Pengabdian masyarakat",
  "Seminar atau pelatihan",
  "Prestasi akademik",
  "Lainnya",
] as const;

export const SKPM_LEVELS = [
  "Kampus",
  "Kota/kabupaten",
  "Provinsi",
  "Nasional",
  "Internasional",
] as const;

/** The kategori an activity row gets when the file leaves it empty. */
export const OTHER_CATEGORY = "Lainnya";

/** The longest text kept from a cell of a file. */
export const ACTIVITY_MAX_LENGTH = 200;
export const LABEL_MAX_LENGTH = 100;
export const DAY_TEXT_MAX_LENGTH = 30;
