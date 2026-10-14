/** What an entry or a cancel answers to a role without the right. */
export const NOT_ALLOWED_TO_ADJUST = {
  ok: false,
  error:
    "Anda tidak berhak menginput atau membatalkan nilai SIKU. Nilai SIKU diinput oleh Penilai Mahasiswa.",
} as const;

export const NO_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, sehingga nilai SIKU belum dapat disimpan.",
} as const;

/**
 * What an entry answers when it names a student who is not Aktif now, or
 * who does not exist. Nothing of it is kept.
 */
export const NOT_ACTIVE_STUDENTS = {
  ok: false,
  error:
    "Ada mahasiswa yang tidak aktif lagi atau tidak ditemukan, jadi belum ada yang disimpan. Muat ulang halaman, lalu pilih lagi.",
} as const;

/**
 * What an entry answers when its key is that of an entry it did not just
 * add: the form was sent before and changed since, or the key is not its
 * own.
 */
export const ENTRY_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa Riwayat penambahan dan pengurangan SIKU, lalu simpan lagi bila masih perlu.",
} as const;

/** What a cancel answers for an entry that is not there. */
export const ENTRY_NOT_FOUND = {
  ok: false,
  error: "Penyesuaian ini tidak ditemukan. Muat ulang halaman.",
} as const;

/** What a cancel answers for an entry that was cancelled before. */
export const ALREADY_CANCELLED = {
  ok: false,
  error:
    "Penyesuaian ini sudah dibatalkan, jadi tidak dapat dibatalkan lagi. Muat ulang halaman.",
} as const;
