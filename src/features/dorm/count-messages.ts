/** What a count answers to a role without the right. */
export const COUNT_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menghitung kehadiran kegiatan asrama.",
} as const;

/**
 * What a save answers when the count kept is not the one the form was
 * opened on: someone else saved it in between, or the form was sent twice.
 */
export const COUNT_CHANGED = {
  ok: false,
  error: "Penghitungan sudah diubah orang lain. Muat ulang.",
} as const;

/** What a save answers for an activity that does not take place that day. */
export const NOT_HELD_THAT_DAY = {
  ok: false,
  error:
    "Kegiatan ini tidak ada pada tanggal tersebut, mungkin baru saja diubah atau dihapus. Muat ulang.",
} as const;

export const NOT_STARTED_WORDS =
  "Kegiatan belum dimulai. Penghitungan dapat diisi setelah kegiatan dimulai.";

export const NOT_STARTED = { ok: false, error: NOT_STARTED_WORDS } as const;

/** After an announcement a correction goes out only as "Umumkan ulang". */
export const ANNOUNCED_ALREADY = {
  ok: false,
  error:
    "Ketidakhadiran kegiatan ini sudah diumumkan. Perubahan hanya dapat dikirim dengan Umumkan ulang.",
} as const;

/** What a save answers when it names someone who does not take part. */
export const NOT_A_PARTICIPANT = {
  ok: false,
  error: "Daftar peserta sudah berubah. Muat ulang halaman, lalu isi lagi.",
} as const;
