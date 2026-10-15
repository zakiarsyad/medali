/** What an upload, a removal or a conversion answers to a role without the right. */
export const NOT_ALLOWED_TO_UPLOAD = {
  ok: false,
  error:
    "Anda tidak berhak mengunggah data SKPM atau mengubah konversinya. Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
} as const;

export const NO_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, sehingga data SKPM belum dapat disimpan.",
} as const;

export const NOTHING_TO_SAVE = {
  ok: false,
  error:
    "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
} as const;

/**
 * What a save answers when its key is that of an upload it did not just
 * add: another file, another mode, or another account's.
 */
export const FILE_ALREADY_SENT = {
  ok: false,
  error:
    "Berkas ini sudah pernah terkirim, jadi tidak disimpan lagi. Muat ulang halaman, periksa Riwayat unggahan, lalu unggah lagi bila masih perlu.",
} as const;

export const UNKNOWN_MODE = {
  ok: false,
  error: "Pilih Tambahkan atau Ganti semua data, lalu simpan lagi.",
} as const;

/** What a removal answers for an upload that is not there. */
export const UPLOAD_NOT_FOUND = {
  ok: false,
  error: "Unggahan ini tidak ditemukan. Muat ulang halaman.",
} as const;

/** What a removal answers for an upload removed before. */
export const ALREADY_REMOVED = {
  ok: false,
  error: "Unggahan ini sudah dihapus. Muat ulang halaman.",
} as const;
