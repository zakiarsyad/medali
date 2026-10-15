/** What a save or a cancel answers to a role without the right. */
export const NOT_ALLOWED_TO_RECORD = {
  ok: false,
  error:
    "Anda tidak berhak mencatat atau membatalkan pelanggaran asrama. Pelanggaran dicatat oleh Badan Asrama Mahasiswa.",
} as const;

/**
 * What a save answers when a student of the list does not live in a dorm
 * today, or is not found. Nothing of the list is kept.
 */
export const NOT_RESIDENTS = {
  ok: false,
  error:
    "Ada mahasiswa yang tidak tinggal di asrama lagi atau tidak ditemukan, jadi belum ada yang disimpan. Muat ulang halaman, lalu pilih lagi.",
} as const;

/**
 * What a save answers when its key is that of a list it did not just
 * keep: the form was sent before and changed since, or the key is not
 * its own.
 */
export const LIST_ALREADY_SENT = {
  ok: false,
  error:
    "Daftar ini sudah pernah tersimpan, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa Jadwal publikasi, lalu simpan lagi bila masih perlu.",
} as const;

/** What a cancel answers for a violation that is not there. */
export const VIOLATION_NOT_FOUND = {
  ok: false,
  error: "Pelanggaran ini tidak ditemukan. Muat ulang halaman.",
} as const;

/** What a cancel answers for a violation cancelled before. */
export const ALREADY_CANCELLED = {
  ok: false,
  error: "Pelanggaran ini sudah dibatalkan. Muat ulang halaman.",
} as const;

/** What a cancel answers once the announcement hour has come. */
export const ALREADY_ANNOUNCED = {
  ok: false,
  error:
    "Pelanggaran ini sudah diumumkan, jadi tidak dapat dibatalkan lagi. Muat ulang halaman.",
} as const;
