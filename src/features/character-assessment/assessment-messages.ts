/** What a save answers to a role without the right Asesmen karakter. */
export const NOT_ALLOWED_TO_ASSESS = {
  ok: false,
  error:
    "Anda tidak berhak menginput asesmen karakter. Hasil asesmen MEDALI diinput oleh Penilai Mahasiswa atau Kepala Unit Pembangunan Karakter.",
} as const;

export const NO_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, sehingga asesmen belum dapat disimpan.",
} as const;

export const NO_STUDENT = {
  ok: false,
  error: "Pilih mahasiswa terlebih dahulu.",
} as const;

/**
 * What a save answers for a student who is not Aktif now, who does not
 * exist, or whom the account may not see. Nothing of it is kept.
 */
export const STUDENT_NOT_FOUND = {
  ok: false,
  error:
    "Mahasiswa ini tidak aktif lagi atau tidak ditemukan, jadi asesmen tidak disimpan. Muat ulang halaman, lalu pilih lagi.",
} as const;

export const INVALID_SCORES = {
  ok: false,
  error: "Skor setiap nilai harus bilangan bulat 40–100.",
} as const;

/**
 * What a save answers for a score above 70 of a student under a Ringan
 * or Sedang penalty: the form does not offer one, so it was sent by hand
 * or the penalty came after the form opened.
 */
export const OVER_LIMIT = {
  ok: false,
  error:
    "Skor di atas 70 untuk mahasiswa dalam hukuman disiplin tidak dapat disimpan. Muat ulang halaman, ubah skor menjadi paling tinggi 70, lalu simpan lagi.",
} as const;

export const UNKNOWN_SOURCE = {
  ok: false,
  error: "Pilih sumber asesmen dari daftar.",
} as const;

export const NOTE_TOO_LONG = {
  ok: false,
  error: "Catatan penilai paling banyak 500 karakter.",
} as const;

/**
 * What a save answers when its key is that of an assessment it did not
 * just add: the form was sent before and changed since, or the key is
 * not its own.
 */
export const ASSESSMENT_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa Hasil asesmen karakter, lalu simpan lagi bila masih perlu.",
} as const;

export const NOTHING_TO_SAVE = {
  ok: false,
  error:
    "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
} as const;

/**
 * What a file's save answers when its key is that of an upload it did
 * not just add: another file, another source, or another account's.
 */
export const FILE_ALREADY_SENT = {
  ok: false,
  error:
    "Berkas ini sudah pernah terkirim, jadi tidak disimpan lagi. Muat ulang halaman, periksa Hasil asesmen karakter, lalu unggah lagi bila masih perlu.",
} as const;
